package com.example.project.service;

import java.math.BigDecimal;
import java.util.Map;

import com.example.project.dto.response.PaymentUrlResponse;
import com.example.project.dto.response.WalletResponse;

public interface WalletService {

    WalletResponse getWallet(String email);

    PaymentUrlResponse createTopUp(String email, BigDecimal amount, String ipAddr);

    Map<String, String> handleIpn(Map<String, String> params);
}
