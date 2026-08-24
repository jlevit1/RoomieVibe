package com.example.project.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

import com.example.project.entity.WalletTransactionType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WalletTransactionResponse {
    private Long id;
    private WalletTransactionType type;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private Instant createdAt;
}
