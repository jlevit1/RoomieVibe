package com.example.project.repository;

import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.project.entity.ListingRental;
import com.example.project.entity.RoomListing;
import com.example.project.entity.User;

public interface ListingRentalRepository extends JpaRepository<ListingRental, Long> {

    boolean existsByListingAndTenant(RoomListing listing, User tenant);

    @Query("SELECT r.tenant.id FROM ListingRental r WHERE r.listing = :listing")
    Set<Long> findTenantIdsByListing(@Param("listing") RoomListing listing);
}
