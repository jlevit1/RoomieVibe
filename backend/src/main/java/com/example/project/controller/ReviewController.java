package com.example.project.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project.dto.request.ReviewRequest;
import com.example.project.dto.response.ReviewSummaryResponse;
import com.example.project.service.ReviewService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Review", description = "Danh gia tin dang phong tro")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/listings/{id}")
    public ResponseEntity<ReviewSummaryResponse> getListingReviews(
            Authentication authentication, @PathVariable Long id) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(reviewService.getListingReviews(email, id));
    }

    @PostMapping("/listings/{id}")
    public ResponseEntity<Void> upsertListingReview(
            Authentication authentication, @PathVariable Long id, @Valid @RequestBody ReviewRequest request) {
        reviewService.upsertListingReview(authentication.getName(), id, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/listings/{id}")
    public ResponseEntity<Void> deleteListingReview(Authentication authentication, @PathVariable Long id) {
        reviewService.deleteListingReview(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
