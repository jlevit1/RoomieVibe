package com.example.project.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateDepositRequestRequest {

    @NotNull(message = "So tien khong duoc de trong")
    @DecimalMin(value = "1000", message = "So tien coc toi thieu la 1,000d")
    private BigDecimal amount;
}
