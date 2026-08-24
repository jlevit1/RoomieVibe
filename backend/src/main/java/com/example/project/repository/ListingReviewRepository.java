package com.example.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project.entity.ListingReview;
import com.example.project.entity.RoomListing;
import com.example.project.entity.User;

public interface ListingReviewRepository extends JpaRepository<ListingReview, Long> {

    List<ListingReview> findByListingOrderByCreatedAtDesc(RoomListing listing);

    Optional<ListingReview> findByUserAndListing(User user, RoomListing listing);
}
