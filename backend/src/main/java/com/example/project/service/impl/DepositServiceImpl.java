package com.example.project.service.impl;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
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
import com.example.project.entity.NotificationType;
import com.example.project.entity.Role;
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
import com.example.project.service.NotificationService;
import com.example.project.service.NotificationService.Mail;

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
    private final NotificationService notificationService;

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
        // Fast-path check only - the authoritative check is inside adjustBalance,
        // against the row-locked balance, so two concurrent "pay" calls can't both
        // pass this and overdraw the wallet.
        if (renter.getBalance().compareTo(deposit.getAmount()) < 0) {
            throw new BadRequestException("So du vi khong du, vui long nap them tien");
        }

        adjustBalance(renter, deposit.getAmount().negate(), WalletTransactionType.GIU_COC);

        deposit.setStatus(DepositStatus.DA_THANH_TOAN);
        depositBookingRepository.save(deposit);

        Conversation conversation = deposit.getConversation();
        String amount = Formats.money(deposit.getAmount());
        String room = quoted(conversation.getListing().getTitle());
        String link = chatLink(conversation);
        notificationService.notifyWithMail(landlordOf(conversation), NotificationType.DEPOSIT_PAID,
                renter.getFullName() + " đã thanh toán cọc " + amount + " cho phòng " + room, link,
                new Mail("Có người đã đặt cọc " + amount + " cho phòng của bạn",
                        List.of("Phòng: " + room, "Người thuê: " + renter.getFullName(), "Số tiền: " + amount,
                                "Tiền đang được hệ thống giữ. Bạn nhận được tiền khi người thuê xác nhận đã xem phòng."),
                        "Mở cuộc trò chuyện"));
        notificationService.emailOnly(renter,
                "Bạn đã thanh toán cọc " + amount + " cho phòng " + room + ".", link,
                new Mail("Biên nhận đặt cọc " + amount,
                        List.of("Phòng: " + room, "Số tiền: " + amount, "Thời điểm: " + Formats.dateTime(Instant.now()),
                                "Tiền được hệ thống giữ hộ, chuyển cho chủ nhà khi bạn xác nhận đã xem phòng."),
                        "Mở cuộc trò chuyện"));
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

        boolean wasPaid = deposit.getStatus() == DepositStatus.DA_THANH_TOAN;
        if (wasPaid) {
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
        notifyCancelled(deposit, conversation, isRenter, wasPaid);
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

        Conversation conversation = deposit.getConversation();
        String amount = Formats.money(deposit.getAmount());
        String room = quoted(conversation.getListing().getTitle());
        String link = chatLink(conversation);
        notificationService.notifyWithMail(landlordOf(conversation), NotificationType.DEPOSIT_COMPLETED,
                "Bạn đã nhận " + amount + " tiền cọc phòng " + room, link,
                new Mail("Bạn đã nhận " + amount + " tiền cọc",
                        List.of("Phòng: " + room, "Người thuê: " + renter.getFullName(), "Số tiền đã cộng vào ví: " + amount),
                        "Xem ví của tôi"));
        notificationService.emailOnly(renter,
                "Bạn đã xác nhận xem phòng " + room + ". Tiền cọc " + amount + " đã chuyển cho chủ nhà.", link,
                new Mail("Đã chốt tiền cọc " + amount, List.of("Phòng: " + room, "Số tiền: " + amount), "Mở cuộc trò chuyện"));
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

        String amount = Formats.money(deposit.getAmount());
        String room = quoted(conversation.getListing().getTitle());
        User counterpart = isRenter ? landlordOf(conversation) : conversation.getRenter();
        notificationService.notifyWithMail(counterpart, NotificationType.DEPOSIT_DISPUTED,
                user.getFullName() + " báo vấn đề với khoản cọc " + amount + " của phòng " + room, chatLink(conversation),
                new Mail("Khoản cọc " + amount + " đang có tranh chấp",
                        List.of("Phòng: " + room, "Lý do được nêu: " + reason,
                                "Tiền cọc được giữ nguyên cho tới khi quản trị viên xử lý."),
                        "Mở cuộc trò chuyện"));
        for (User admin : userRepository.findByRoleAndEnabledTrue(Role.ADMIN)) {
            notificationService.notifyWithMail(admin, NotificationType.DEPOSIT_DISPUTED,
                    "Tranh chấp đặt cọc " + amount + " của phòng " + room, "/admin/disputes",
                    new Mail("Có tranh chấp đặt cọc cần xử lý",
                            List.of("Phòng: " + room, "Số tiền: " + amount, "Người báo: " + user.getFullName(),
                                    "Lý do: " + reason),
                            "Xử lý tranh chấp"));
        }
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

        Conversation conversation = deposit.getConversation();
        String amount = Formats.money(deposit.getAmount());
        String room = quoted(conversation.getListing().getTitle());
        String outcome = releaseToLandlord
                ? "Quản trị viên đã chuyển " + amount + " cho chủ nhà."
                : "Quản trị viên đã hoàn " + amount + " về ví của người thuê.";
        List<String> details = new ArrayList<>(List.of("Phòng: " + room, "Kết quả: " + outcome));
        if (note != null && !note.isBlank()) details.add("Ghi chú của quản trị viên: " + note);
        for (User party : List.of(landlordOf(conversation), conversation.getRenter())) {
            notificationService.notifyWithMail(party, NotificationType.DEPOSIT_RESOLVED,
                    "Tranh chấp cọc phòng " + room + " đã được xử lý. " + outcome, chatLink(conversation),
                    new Mail("Tranh chấp đặt cọc đã được xử lý", details, "Xem chi tiết"));
        }
        return broadcastDepositUpdate(deposit);
    }

    private void notifyCancelled(DepositBooking deposit, Conversation conversation, boolean cancelledByRenter, boolean wasPaid) {
        String amount = Formats.money(deposit.getAmount());
        String room = quoted(conversation.getListing().getTitle());
        String link = chatLink(conversation);
        User renter = conversation.getRenter();
        User landlord = landlordOf(conversation);
        User actor = cancelledByRenter ? renter : landlord;
        User counterpart = cancelledByRenter ? landlord : renter;

        String forCounterpart;
        String forActor = null;
        if (!wasPaid) {
            forCounterpart = actor.getFullName() + " đã hủy yêu cầu đặt cọc " + amount + " cho phòng " + room + ".";
        } else if (cancelledByRenter) {
            forCounterpart = renter.getFullName() + " đã hủy sau khi đặt cọc. Bạn nhận " + amount + " vào ví.";
            forActor = "Bạn đã hủy khoản cọc " + amount + " sau khi thanh toán, nên khoản này chuyển cho chủ nhà.";
        } else {
            forCounterpart = "Chủ nhà đã hủy yêu cầu. " + amount + " đã được hoàn về ví của bạn.";
            forActor = "Bạn đã hủy khoản cọc " + amount + ", số tiền đã hoàn về ví người thuê.";
        }
        notificationService.notifyWithMail(counterpart, NotificationType.DEPOSIT_CANCELLED, forCounterpart, link,
                new Mail("Yêu cầu đặt cọc " + amount + " đã bị hủy", List.of("Phòng: " + room, "Số tiền: " + amount),
                        "Mở cuộc trò chuyện"));
        if (forActor != null) {
            notificationService.emailOnly(actor, forActor, link,
                    new Mail("Bạn đã hủy khoản cọc " + amount, List.of("Phòng: " + room, "Số tiền: " + amount),
                            "Mở cuộc trò chuyện"));
        }
    }

    private static User landlordOf(Conversation conversation) {
        return conversation.getListing().getLandlord();
    }

    private static String chatLink(Conversation conversation) {
        return "/messages/" + conversation.getId();
    }

    private static String quoted(String title) {
        return "\u201c" + title + "\u201d";
    }

    private void adjustBalance(User user, BigDecimal delta, WalletTransactionType type) {
        // Atomic DB-level update - see UserRepository.adjustBalanceAtomic for why
        // a plain read-modify-write on the entity is unsafe under concurrency.
        int updated = userRepository.adjustBalanceAtomic(user.getId(), delta);
        if (updated == 0) {
            throw new BadRequestException("So du vi khong du, vui long nap them tien");
        }
        BigDecimal newBalance = userRepository.getBalance(user.getId());

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
