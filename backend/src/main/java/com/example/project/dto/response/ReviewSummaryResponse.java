package com.example.project.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ReviewSummaryResponse {
    private Double averageRating;
    private int totalReviews;
    private List<ReviewResponse> reviews;
}
