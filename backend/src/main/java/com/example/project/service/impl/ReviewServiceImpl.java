package com.example.project.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.project.dto.request.ReviewRequest;
import com.example.project.dto.response.ReviewResponse;
import com.example.project.dto.response.ReviewSummaryResponse;
import com.example.project.entity.ListingReview;
import com.example.project.entity.RoomListing;
import com.example.project.entity.User;
import com.example.project.exception.BadRequestException;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.repository.ListingReviewRepository;
import com.example.project.repository.RoomListingRepository;
import com.example.project.repository.UserRepository;
import com.example.project.service.ReviewService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final UserRepository userRepository;
    private final RoomListingRepository roomListingRepository;
    private final ListingReviewRepository listingReviewRepository;

    @Override
    public ReviewSummaryResponse getListingReviews(String email, Long listingId) {
        RoomListing listing = findListing(listingId);
        List<ListingReview> reviews = listingReviewRepository.findByListingOrderByCreatedAtDesc(listing);

        List<ReviewResponse> responses = reviews.stream()
                .map(r -> ReviewResponse.builder()
                        .id(r.getId())
                        .reviewerName(r.getUser().getFullName())
                        .rating(r.getRating())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .own(email != null && email.equals(r.getUser().getEmail()))
                        .build())
                .toList();

        return buildSummary(responses);
    }

    @Override
    public void upsertListingReview(String email, Long listingId, ReviewRequest request) {
        User user = findUser(email);
        RoomListing listing = findListing(listingId);

        if (listing.getLandlord().getId().equals(user.getId())) {
            throw new BadRequestException("Khong the tu danh gia tin dang cua chinh minh");
        }

        ListingReview review = listingReviewRepository.findByUserAndListing(user, listing)
                .orElseGet(() -> ListingReview.builder().user(user).listing(listing).build());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        listingReviewRepository.save(review);
    }

    @Override
    public void deleteListingReview(String email, Long listingId) {
        User user = findUser(email);
        RoomListing listing = findListing(listingId);
        ListingReview review = listingReviewRepository.findByUserAndListing(user, listing)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay danh gia"));
        listingReviewRepository.delete(review);
    }

    private ReviewSummaryResponse buildSummary(List<ReviewResponse> responses) {
        double average = responses.stream()
                .mapToInt(ReviewResponse::getRating)
                .average()
                .orElse(0.0);

        return ReviewSummaryResponse.builder()
                .averageRating(Math.round(average * 10) / 10.0)
                .totalReviews(responses.size())
                .reviews(responses)
                .build();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }

    private RoomListing findListing(Long id) {
        return roomListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tin dang"));
    }
}
