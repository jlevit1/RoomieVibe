package com.example.project.dto.response;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private String reviewerName;
    private Integer rating;
    private String comment;
    private Instant createdAt;
    private boolean own;
    // RENTED (landlord confirmed them as tenant), DEPOSIT (completed a viewing deposit), or null.
    private String verifiedType;
}
