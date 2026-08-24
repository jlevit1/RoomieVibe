package com.example.project.service.impl;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project.dto.response.PaymentUrlResponse;
import com.example.project.dto.response.WalletResponse;
import com.example.project.dto.response.WalletTransactionResponse;
import com.example.project.entity.PaymentStatus;
import com.example.project.entity.PaymentTransaction;
import com.example.project.entity.User;
import com.example.project.entity.WalletTransaction;
import com.example.project.entity.WalletTransactionType;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.repository.PaymentTransactionRepository;
import com.example.project.repository.UserRepository;
import com.example.project.repository.WalletTransactionRepository;
import com.example.project.security.VNPayService;
import com.example.project.service.WalletService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class WalletServiceImpl implements WalletService {

    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final VNPayService vnPayService;

    @Override
    public WalletResponse getWallet(String email) {
        User user = findUser(email);
        var history = walletTransactionRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
        return WalletResponse.builder().balance(user.getBalance()).transactions(history).build();
    }

    @Override
    public PaymentUrlResponse createTopUp(String email, BigDecimal amount, String ipAddr) {
        User user = findUser(email);
        String txnRef = String.valueOf(System.currentTimeMillis());

        PaymentTransaction tx = PaymentTransaction.builder()
                .user(user)
                .txnRef(txnRef)
                .amount(amount)
                .status(PaymentStatus.PENDING)
                .build();
        paymentTransactionRepository.save(tx);

        String paymentUrl = vnPayService.buildPaymentUrl(
                txnRef, amount.longValueExact(), "Nap tien vi RoomieVibe", ipAddr);
        return PaymentUrlResponse.builder().paymentUrl(paymentUrl).build();
    }

    @Override
    public Map<String, String> handleIpn(Map<String, String> params) {
        Map<String, String> result = new HashMap<>();

        if (!vnPayService.verifySignature(params)) {
            result.put("RspCode", "97");
            result.put("Message", "Invalid signature");
            return result;
        }

        Optional<PaymentTransaction> txOpt = paymentTransactionRepository.findByTxnRef(params.get("vnp_TxnRef"));
        if (txOpt.isEmpty()) {
            result.put("RspCode", "01");
            result.put("Message", "Order not found");
            return result;
        }
        PaymentTransaction tx = txOpt.get();

        long expectedAmount = tx.getAmount().longValueExact() * 100;
        long receivedAmount = Long.parseLong(params.get("vnp_Amount"));
        if (expectedAmount != receivedAmount) {
            result.put("RspCode", "04");
            result.put("Message", "Invalid amount");
            return result;
        }

        if (tx.getStatus() != PaymentStatus.PENDING) {
            result.put("RspCode", "02");
            result.put("Message", "Order already confirmed");
            return result;
        }

        String responseCode = params.get("vnp_ResponseCode");
        tx.setResponseCode(responseCode);
        tx.setVnpTransactionNo(params.get("vnp_TransactionNo"));

        if ("00".equals(responseCode)) {
            tx.setStatus(PaymentStatus.SUCCESS);
            User user = tx.getUser();
            BigDecimal newBalance = user.getBalance().add(tx.getAmount());
            user.setBalance(newBalance);
            userRepository.save(user);

            walletTransactionRepository.save(WalletTransaction.builder()
                    .user(user)
                    .type(WalletTransactionType.NAP_TIEN)
                    .amount(tx.getAmount())
                    .balanceAfter(newBalance)
                    .relatedPayment(tx)
                    .build());
        } else {
            tx.setStatus(PaymentStatus.FAILED);
        }
        paymentTransactionRepository.save(tx);

        result.put("RspCode", "00");
        result.put("Message", "Confirm Success");
        return result;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }

    private WalletTransactionResponse toResponse(WalletTransaction t) {
        return WalletTransactionResponse.builder()
                .id(t.getId())
                .type(t.getType())
                .amount(t.getAmount())
                .balanceAfter(t.getBalanceAfter())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
