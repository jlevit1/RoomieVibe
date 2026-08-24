package com.example.project.service.impl;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project.dto.response.ChatMessageResponse;
import com.example.project.dto.response.DepositBookingResponse;
import com.example.project.entity.ChatMessage;
import com.example.project.entity.Conversation;
import com.example.project.entity.DepositBooking;
import com.example.project.entity.DepositStatus;
import com.example.project.entity.User;
import com.example.project.entity.WalletTransaction;
import com.example.project.entity.WalletTransactionType;
import com.example.project.exception.BadRequestException;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.repository.ChatMessageRepository;
import com.example.project.repository.DepositBookingRepository;
import com.example.project.repository.UserRepository;
import com.example.project.repository.WalletTransactionRepository;
import com.example.project.service.DepositService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DepositServiceImpl implements DepositService {

    private final UserRepository userRepository;
    private final DepositBookingRepository depositBookingRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final ChatMapper chatMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public ChatMessageResponse pay(String email, Long depositId) {
        User user = findUser(email);
        DepositBooking deposit = findDeposit(depositId);
        User renter = deposit.getConversation().getRenter();

        if (!renter.getId().equals(user.getId())) {
            throw new BadRequestException("Chi nguoi thue moi thanh toan duoc");
        }
        if (deposit.getStatus() != DepositStatus.CHO_THANH_TOAN) {
            throw new BadRequestException("Yeu cau dat coc khong o trang thai cho thanh toan");
        }
        if (renter.getBalance().compareTo(deposit.getAmount()) < 0) {
            throw new BadRequestException("So du vi khong du, vui long nap them tien");
        }

        adjustBalance(renter, deposit.getAmount().negate(), WalletTransactionType.GIU_COC);

        deposit.setStatus(DepositStatus.DA_THANH_TOAN);
        depositBookingRepository.save(deposit);
        return broadcastDepositUpdate(deposit);
    }

    @Override
    public ChatMessageResponse cancel(String email, Long depositId) {
        User user = findUser(email);
        DepositBooking deposit = findDeposit(depositId);
        Conversation conversation = deposit.getConversation();
        boolean isRenter = conversation.getRenter().getId().equals(user.getId());
        boolean isLandlord = conversation.getListing().getLandlord().getId().equals(user.getId());
        if (!isRenter && !isLandlord) {
            throw new BadRequestException("Ban khong co quyen huy yeu cau nay");
        }

        if (deposit.getStatus() == DepositStatus.DA_THANH_TOAN) {
            if (isRenter) {
                // Nguoi thue tu huy sau khi da tra: mat coc, chuyen cho chu nha
                adjustBalance(conversation.getListing().getLandlord(), deposit.getAmount(), WalletTransactionType.NHAN_COC);
            } else {
                // Chu nha tu huy: hoan lai cho nguoi thue
                adjustBalance(conversation.getRenter(), deposit.getAmount(), WalletTransactionType.HOAN_COC);
            }
        } else if (deposit.getStatus() != DepositStatus.CHO_THANH_TOAN) {
            throw new BadRequestException("Khong the huy yeu cau o trang thai hien tai");
        }

        deposit.setStatus(DepositStatus.DA_HUY);
        depositBookingRepository.save(deposit);
        return broadcastDepositUpdate(deposit);
    }

    @Override
    public ChatMessageResponse complete(String email, Long depositId) {
        User user = findUser(email);
        DepositBooking deposit = findDeposit(depositId);
        User renter = deposit.getConversation().getRenter();
        if (!renter.getId().equals(user.getId())) {
            throw new BadRequestException("Chi nguoi thue moi xac nhan duoc");
        }
        if (deposit.getStatus() != DepositStatus.DA_THANH_TOAN) {
            throw new BadRequestException("Yeu cau dat coc khong o trang thai da thanh toan");
        }

        adjustBalance(deposit.getConversation().getListing().getLandlord(), deposit.getAmount(), WalletTransactionType.NHAN_COC);

        deposit.setStatus(DepositStatus.HOAN_THANH);
        depositBookingRepository.save(deposit);
        return broadcastDepositUpdate(deposit);
    }

    @Override
    public ChatMessageResponse dispute(String email, Long depositId, String reason) {
        User user = findUser(email);
        DepositBooking deposit = findDeposit(depositId);
        Conversation conversation = deposit.getConversation();
        boolean isRenter = conversation.getRenter().getId().equals(user.getId());
        boolean isLandlord = conversation.getListing().getLandlord().getId().equals(user.getId());
        if (!isRenter && !isLandlord) {
            throw new BadRequestException("Ban khong co quyen bao tranh chap cho yeu cau nay");
        }
        if (deposit.getStatus() != DepositStatus.DA_THANH_TOAN) {
            throw new BadRequestException("Yeu cau dat coc khong o trang thai da thanh toan");
        }

        deposit.setStatus(DepositStatus.TRANH_CHAP);
        deposit.setDisputeReason(reason);
        depositBookingRepository.save(deposit);
        return broadcastDepositUpdate(deposit);
    }

    @Override
    public List<DepositBookingResponse> listDisputed() {
        return depositBookingRepository.findByStatusOrderByCreatedAtDesc(DepositStatus.TRANH_CHAP).stream()
                .map(chatMapper::toDepositResponse)
                .toList();
    }

    @Override
    public ChatMessageResponse resolveDispute(Long depositId, boolean releaseToLandlord, String note) {
        DepositBooking deposit = findDeposit(depositId);
        if (deposit.getStatus() != DepositStatus.TRANH_CHAP) {
            throw new BadRequestException("Yeu cau dat coc khong o trang thai tranh chap");
        }

        if (releaseToLandlord) {
            adjustBalance(deposit.getConversation().getListing().getLandlord(), deposit.getAmount(), WalletTransactionType.NHAN_COC);
            deposit.setStatus(DepositStatus.DA_CHUYEN_CHU_NHA);
        } else {
            adjustBalance(deposit.getConversation().getRenter(), deposit.getAmount(), WalletTransactionType.HOAN_COC);
            deposit.setStatus(DepositStatus.DA_HOAN_TIEN);
        }
        deposit.setResolutionNote(note);
        depositBookingRepository.save(deposit);
        return broadcastDepositUpdate(deposit);
    }

    private void adjustBalance(User user, BigDecimal delta, WalletTransactionType type) {
        BigDecimal newBalance = user.getBalance().add(delta);
        user.setBalance(newBalance);
        userRepository.save(user);
        walletTransactionRepository.save(WalletTransaction.builder()
                .user(user)
                .type(type)
                .amount(delta.abs())
                .balanceAfter(newBalance)
                .build());
    }

    private ChatMessageResponse broadcastDepositUpdate(DepositBooking deposit) {
        ChatMessage message = chatMessageRepository.findByDepositBooking(deposit)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tin nhan lien quan"));
        ChatMessageResponse response = chatMapper.toMessageResponse(message);
        messagingTemplate.convertAndSend("/topic/conversations/" + deposit.getConversation().getId(), response);
        return response;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }

    private DepositBooking findDeposit(Long id) {
        return depositBookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay yeu cau dat coc"));
    }
}
