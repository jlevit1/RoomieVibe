package com.example.project.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AdminChartPoint {
    private String date;
    private long count;
    private BigDecimal amount;
}
