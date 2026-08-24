package com.example.project.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TopUpRequest {

    @NotNull(message = "So tien khong duoc de trong")
    @DecimalMin(value = "10000", message = "So tien nap toi thieu la 10,000d")
    private BigDecimal amount;
}
