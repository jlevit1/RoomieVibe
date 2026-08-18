package com.example.project.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.project.entity.ListingStatus;
import com.example.project.entity.RoomListing;
import com.example.project.entity.User;

public interface RoomListingRepository extends JpaRepository<RoomListing, Long> {

    List<RoomListing> findByLandlordOrderByCreatedAtDesc(User landlord);

    List<RoomListing> findByStatusOrderByCreatedAtDesc(ListingStatus status);

    long countByStatus(ListingStatus status);

    @Query("SELECT r FROM RoomListing r WHERE r.status = :status "
            + "AND (:city IS NULL OR r.city = :city) "
            + "AND (:district IS NULL OR r.district = :district) "
            + "AND (:minPrice IS NULL OR r.price >= :minPrice) "
            + "AND (:maxPrice IS NULL OR r.price <= :maxPrice) "
            + "AND (:maxOccupants IS NULL OR r.maxOccupants >= :maxOccupants)")
    Page<RoomListing> search(@Param("status") ListingStatus status,
                              @Param("city") String city,
                              @Param("district") String district,
                              @Param("minPrice") BigDecimal minPrice,
                              @Param("maxPrice") BigDecimal maxPrice,
                              @Param("maxOccupants") Integer maxOccupants,
                              Pageable pageable);
}
