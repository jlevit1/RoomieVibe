package com.example.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project.entity.FavoriteListing;
import com.example.project.entity.RoomListing;
import com.example.project.entity.User;

public interface FavoriteListingRepository extends JpaRepository<FavoriteListing, Long> {

    Optional<FavoriteListing> findByUserAndListing(User user, RoomListing listing);

    List<FavoriteListing> findByUserOrderByCreatedAtDesc(User user);

    void deleteByUserAndListing(User user, RoomListing listing);
}
