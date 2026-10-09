package com.example.project.repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.project.entity.DepositBooking;
import com.example.project.entity.DepositStatus;
import com.example.project.entity.RoomListing;

public interface DepositBookingRepository extends JpaRepository<DepositBooking, Long> {

    List<DepositBooking> findByStatusOrderByCreatedAtDesc(DepositStatus status);

    @Query("SELECT d.conversation.renter.id FROM DepositBooking d "
            + "WHERE d.conversation.listing = :listing AND d.status IN :statuses")
    Set<Long> findRenterIdsByListingAndStatusIn(@Param("listing") RoomListing listing,
                                                 @Param("statuses") Collection<DepositStatus> statuses);
}
