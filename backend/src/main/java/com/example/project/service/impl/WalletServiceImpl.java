package com.example.project.service.impl;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project.dto.response.PaymentUrlResponse;
import com.example.project.dto.response.WalletResponse;
import com.example.project.dto.response.WalletTransactionResponse;
import com.example.project.entity.NotificationType;
import com.example.project.entity.PaymentStatus;
import com.example.project.entity.PaymentTransaction;
import com.example.project.entity.User;
import com.example.project.entity.WalletTransaction;
import com.example.project.entity.WalletTransactionType;
import com.example.project.exception.BadRequestException;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.repository.PaymentTransactionRepository;
import com.example.project.repository.UserRepository;
import com.example.project.repository.WalletTransactionRepository;
import com.example.project.security.VNPayService;
import com.example.project.service.NotificationService;
import com.example.project.service.NotificationService.Mail;
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
    private final NotificationService notificationService;

    @Override
    public WalletResponse getWallet(String email) {
        User user = findUser(email);
        var history = walletTransactionRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
        return WalletResponse.builder().balance(user.getBalance()).transactions(history).build();
    }

    @Override
    public void debit(User user, BigDecimal amount, WalletTransactionType type) {
        // The guarded atomic update is the authoritative sufficient-funds check, so concurrent charges can't overdraw.
        int updated = userRepository.adjustBalanceAtomic(user.getId(), amount.negate());
        if (updated == 0) {
            throw new BadRequestException("So du vi khong du, vui long nap them tien");
        }
        walletTransactionRepository.save(WalletTransaction.builder()
                .user(user)
                .type(type)
                .amount(amount)
                .balanceAfter(userRepository.getBalance(user.getId()))
                .build());
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
            // Atomic DB-level update so this can't race with a concurrent deposit
            // payment/refund touching the same user's balance (see
            // UserRepository.adjustBalanceAtomic).
            userRepository.adjustBalanceAtomic(user.getId(), tx.getAmount());
            BigDecimal newBalance = userRepository.getBalance(user.getId());

            walletTransactionRepository.save(WalletTransaction.builder()
                    .user(user)
                    .type(WalletTransactionType.NAP_TIEN)
                    .amount(tx.getAmount())
                    .balanceAfter(newBalance)
                    .relatedPayment(tx)
                    .build());

            String amount = Formats.money(tx.getAmount());
            notificationService.notifyWithMail(user, NotificationType.TOPUP_SUCCESS,
                    "Nạp ví thành công " + amount + ". Số dư mới " + Formats.money(newBalance) + ".", "/wallet",
                    new Mail("Nạp ví thành công " + amount,
                            List.of("Số tiền nạp: " + amount, "Số dư hiện tại: " + Formats.money(newBalance),
                                    "Mã giao dịch VNPay: " + params.get("vnp_TransactionNo")),
                            "Xem ví của tôi"));
        } else {
            tx.setStatus(PaymentStatus.FAILED);
            // 24 = the customer cancelled on the VNPay page themselves, no need to tell them what they just did.
            if (!"24".equals(responseCode)) {
                String amount = Formats.money(tx.getAmount());
                notificationService.notifyWithMail(tx.getUser(), NotificationType.TOPUP_FAILED,
                        "Nạp ví " + amount + " không thành công, ví của bạn chưa được cộng tiền.", "/wallet",
                        new Mail("Nạp ví " + amount + " không thành công",
                                List.of("Ngân hàng hoặc VNPay đã từ chối giao dịch (mã " + responseCode + ").",
                                        "Nếu tài khoản ngân hàng của bạn đã bị trừ tiền, hãy liên hệ ngân hàng kèm mã giao dịch "
                                                + params.get("vnp_TxnRef") + "."),
                                "Thử nạp lại"));
            }
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
