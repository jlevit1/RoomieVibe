package com.example.project.service;

import java.math.BigDecimal;
import java.util.Map;

import com.example.project.dto.response.PaymentUrlResponse;
import com.example.project.dto.response.WalletResponse;
import com.example.project.entity.User;
import com.example.project.entity.WalletTransactionType;

public interface WalletService {

    WalletResponse getWallet(String email);

    void debit(User user, BigDecimal amount, WalletTransactionType type);

    PaymentUrlResponse createTopUp(String email, BigDecimal amount, String ipAddr);

    Map<String, String> handleIpn(Map<String, String> params);
}
