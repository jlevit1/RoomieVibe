package com.example.project.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.project.entity.Amenity;
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
            + "AND (:ward IS NULL OR r.ward = :ward) "
            + "AND (:minPrice IS NULL OR r.price >= :minPrice) "
            + "AND (:maxPrice IS NULL OR r.price <= :maxPrice) "
            + "AND (:minArea IS NULL OR r.area >= :minArea) "
            + "AND (:maxArea IS NULL OR r.area <= :maxArea) "
            + "AND (:maxOccupants IS NULL OR r.maxOccupants >= :maxOccupants) "
            + "AND (:amenityCount = 0 OR r.id IN ("
            + "    SELECT r2.id FROM RoomListing r2 JOIN r2.amenities a2 "
            + "    WHERE a2 IN :amenities GROUP BY r2.id HAVING COUNT(a2) = :amenityCount"
            + "))")
    Page<RoomListing> search(@Param("status") ListingStatus status,
                              @Param("city") String city,
                              @Param("district") String district,
                              @Param("ward") String ward,
                              @Param("minPrice") BigDecimal minPrice,
                              @Param("maxPrice") BigDecimal maxPrice,
                              @Param("minArea") Double minArea,
                              @Param("maxArea") Double maxArea,
                              @Param("maxOccupants") Integer maxOccupants,
                              @Param("amenities") List<Amenity> amenities,
                              @Param("amenityCount") long amenityCount,
                              Pageable pageable);
}
