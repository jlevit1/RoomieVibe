package com.example.project.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.project.entity.Amenity;
import com.example.project.entity.ListingStatus;
import com.example.project.entity.RoomListing;
import com.example.project.entity.User;

import jakarta.persistence.LockModeType;

public interface RoomListingRepository extends JpaRepository<RoomListing, Long> {

    List<RoomListing> findByLandlordOrderByCreatedAtDesc(User landlord);

    List<RoomListing> findByStatusOrderByCreatedAtDesc(ListingStatus status);

    long countByStatus(ListingStatus status);

    List<RoomListing> findByCreatedAtAfter(Instant since);

    List<RoomListing> findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(ListingStatus status);

    // Boosts ending within the window whose "expiring soon" notice hasn't gone out for the current end date.
    @Query("SELECT r FROM RoomListing r WHERE r.status = :status AND r.promotedUntil > :now AND r.promotedUntil <= :until "
            + "AND (r.boostExpiryNoticeFor IS NULL OR r.boostExpiryNoticeFor <> r.promotedUntil)")
    List<RoomListing> findBoostsExpiringBetween(@Param("status") ListingStatus status, @Param("now") Instant now,
                                                @Param("until") Instant until);

    // Atomic bump so concurrent viewers never lose an increment; only publicly visible listings count.
    @Modifying
    @Query("UPDATE RoomListing r SET r.viewCount = r.viewCount + 1 WHERE r.id = :id AND r.status IN :statuses")
    int incrementViewCount(@Param("id") Long id, @Param("statuses") List<ListingStatus> statuses);

    // Row lock so a double-clicked boost can't charge twice but extend promotedUntil only once.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RoomListing r WHERE r.id = :id")
    Optional<RoomListing> findByIdForUpdate(@Param("id") Long id);

    // The pageable's sort is appended after this ORDER BY: boosted listings first, then the requested order.
    @Query("SELECT r FROM RoomListing r WHERE r.status = :status "
            + "AND (:city IS NULL OR r.city = :city) "
            + "AND (:district IS NULL OR r.district = :district OR r.district = :districtBare "
            + "     OR r.district LIKE :districtSuffix) "
            + "AND (:ward IS NULL OR r.ward = :ward) "
            + "AND (:minPrice IS NULL OR r.price >= :minPrice) "
            + "AND (:maxPrice IS NULL OR r.price <= :maxPrice) "
            + "AND (:minArea IS NULL OR r.area >= :minArea) "
            + "AND (:maxArea IS NULL OR r.area <= :maxArea) "
            + "AND (:maxOccupants IS NULL OR r.maxOccupants >= :maxOccupants) "
            + "AND (:amenityCount = 0 OR r.id IN ("
            + "    SELECT r2.id FROM RoomListing r2 JOIN r2.amenities a2 "
            + "    WHERE a2 IN :amenities GROUP BY r2.id HAVING COUNT(a2) = :amenityCount"
            + ")) "
            + "ORDER BY CASE WHEN :promoteFirst = true AND r.promotedUntil > :now THEN 0 ELSE 1 END")
    Page<RoomListing> search(@Param("status") ListingStatus status,
                              @Param("city") String city,
                              @Param("district") String district,
                              @Param("districtBare") String districtBare,
                              @Param("districtSuffix") String districtSuffix,
                              @Param("ward") String ward,
                              @Param("minPrice") BigDecimal minPrice,
                              @Param("maxPrice") BigDecimal maxPrice,
                              @Param("minArea") Double minArea,
                              @Param("maxArea") Double maxArea,
                              @Param("maxOccupants") Integer maxOccupants,
                              @Param("amenities") List<Amenity> amenities,
                              @Param("amenityCount") long amenityCount,
                              @Param("promoteFirst") boolean promoteFirst,
                              @Param("now") Instant now,
                              Pageable pageable);

    @Query("SELECT r FROM RoomListing r WHERE r.status = :status "
            + "AND r.latitude BETWEEN :minLat AND :maxLat "
            + "AND r.longitude BETWEEN :minLng AND :maxLng "
            + "AND (:minPrice IS NULL OR r.price >= :minPrice) "
            + "AND (:maxPrice IS NULL OR r.price <= :maxPrice) "
            + "AND (:amenityCount = 0 OR r.id IN ("
            + "    SELECT r2.id FROM RoomListing r2 JOIN r2.amenities a2 "
            + "    WHERE a2 IN :amenities GROUP BY r2.id HAVING COUNT(a2) = :amenityCount"
            + "))")
    List<RoomListing> findInBoundingBox(@Param("status") ListingStatus status,
                                         @Param("minLat") double minLat,
                                         @Param("maxLat") double maxLat,
                                         @Param("minLng") double minLng,
                                         @Param("maxLng") double maxLng,
                                         @Param("minPrice") BigDecimal minPrice,
                                         @Param("maxPrice") BigDecimal maxPrice,
                                         @Param("amenities") List<Amenity> amenities,
                                         @Param("amenityCount") long amenityCount);
}
