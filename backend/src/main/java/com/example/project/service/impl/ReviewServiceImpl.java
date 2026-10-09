package com.example.project.service.impl;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.example.project.dto.request.ReviewRequest;
import com.example.project.dto.response.ReviewResponse;
import com.example.project.dto.response.ReviewSummaryResponse;
import com.example.project.entity.DepositStatus;
import com.example.project.entity.ListingReview;
import com.example.project.entity.RoomListing;
import com.example.project.entity.User;
import com.example.project.exception.BadRequestException;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.repository.DepositBookingRepository;
import com.example.project.repository.ListingRentalRepository;
import com.example.project.repository.ListingReviewRepository;
import com.example.project.repository.RoomListingRepository;
import com.example.project.repository.UserRepository;
import com.example.project.service.ReviewService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private static final String VERIFIED_RENTED = "RENTED";
    private static final String VERIFIED_DEPOSIT = "DEPOSIT";

    // Outcomes where the renter actually saw the room: confirmed it themselves, or admin ruled for the landlord.
    private static final Set<DepositStatus> COMPLETED_DEPOSIT_STATUSES =
            Set.of(DepositStatus.HOAN_THANH, DepositStatus.DA_CHUYEN_CHU_NHA);

    private final UserRepository userRepository;
    private final RoomListingRepository roomListingRepository;
    private final ListingReviewRepository listingReviewRepository;
    private final ListingRentalRepository listingRentalRepository;
    private final DepositBookingRepository depositBookingRepository;

    @Override
    public ReviewSummaryResponse getListingReviews(String email, Long listingId) {
        RoomListing listing = findListing(listingId);
        List<ListingReview> reviews = listingReviewRepository.findByListingOrderByCreatedAtDesc(listing);
        Verification verification = loadVerification(listing);

        List<ReviewResponse> responses = reviews.stream()
                .map(r -> ReviewResponse.builder()
                        .id(r.getId())
                        .reviewerName(r.getUser().getFullName())
                        .rating(r.getRating())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .own(email != null && email.equals(r.getUser().getEmail()))
                        .verifiedType(verification.typeFor(r.getUser().getId()))
                        .build())
                .toList();

        User viewer = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        boolean canReview = viewer != null
                && !listing.getLandlord().getId().equals(viewer.getId())
                && verification.typeFor(viewer.getId()) != null;

        return buildSummary(responses, canReview);
    }

    @Override
    public void upsertListingReview(String email, Long listingId, ReviewRequest request) {
        User user = findUser(email);
        RoomListing listing = findListing(listingId);

        if (listing.getLandlord().getId().equals(user.getId())) {
            throw new BadRequestException("Khong the tu danh gia tin dang cua chinh minh");
        }
        if (loadVerification(listing).typeFor(user.getId()) == null) {
            throw new BadRequestException(
                    "Chi nguoi da thue hoac da dat coc xem phong nay qua RoomieVibe moi duoc danh gia");
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

    // Two queries for the whole listing instead of two per review.
    private Verification loadVerification(RoomListing listing) {
        return new Verification(
                listingRentalRepository.findTenantIdsByListing(listing),
                depositBookingRepository.findRenterIdsByListingAndStatusIn(listing, COMPLETED_DEPOSIT_STATUSES));
    }

    private record Verification(Set<Long> tenantIds, Set<Long> depositRenterIds) {
        String typeFor(Long userId) {
            if (tenantIds.contains(userId)) {
                return VERIFIED_RENTED;
            }
            return depositRenterIds.contains(userId) ? VERIFIED_DEPOSIT : null;
        }
    }

    private ReviewSummaryResponse buildSummary(List<ReviewResponse> responses, boolean canReview) {
        double average = responses.stream()
                .mapToInt(ReviewResponse::getRating)
                .average()
                .orElse(0.0);

        return ReviewSummaryResponse.builder()
                .averageRating(Math.round(average * 10) / 10.0)
                .totalReviews(responses.size())
                .reviews(responses)
                .canReview(canReview)
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
