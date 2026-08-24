package com.example.project.service;

import com.example.project.dto.request.ReviewRequest;
import com.example.project.dto.response.ReviewSummaryResponse;

public interface ReviewService {

    ReviewSummaryResponse getListingReviews(String email, Long listingId);

    void upsertListingReview(String email, Long listingId, ReviewRequest request);

    void deleteListingReview(String email, Long listingId);
}
