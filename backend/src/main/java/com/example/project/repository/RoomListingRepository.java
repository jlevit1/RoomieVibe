package com.example.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project.entity.ListingStatus;
import com.example.project.entity.RoomListing;
import com.example.project.entity.User;

public interface RoomListingRepository extends JpaRepository<RoomListing, Long> {

    List<RoomListing> findByLandlordOrderByCreatedAtDesc(User landlord);

    List<RoomListing> findByStatusOrderByCreatedAtDesc(ListingStatus status);
}
