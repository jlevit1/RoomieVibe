package com.example.project.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

import com.example.project.entity.DepositStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DepositBookingResponse {
    private Long id;
    private String listingTitle;
    private String renterName;
    private String landlordName;
    private BigDecimal amount;
    private DepositStatus status;
    private String disputeReason;
    private String resolutionNote;
    private Instant createdAt;
    private Instant updatedAt;
}
