package com.example.project.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WalletResponse {
    private BigDecimal balance;
    private List<WalletTransactionResponse> transactions;
}
