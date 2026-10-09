package com.example.project.dto.response;

import java.math.BigDecimal;

import com.example.project.entity.BoostPackage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class BoostPackageResponse {
    private BoostPackage code;
    private int days;
    private BigDecimal price;
}
