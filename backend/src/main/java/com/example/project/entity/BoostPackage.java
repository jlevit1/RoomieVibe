package com.example.project.entity;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BoostPackage {
    GOI_3_NGAY(3, new BigDecimal("15000")),
    GOI_7_NGAY(7, new BigDecimal("30000")),
    GOI_30_NGAY(30, new BigDecimal("99000"));

    private final int days;
    private final BigDecimal price;
}
