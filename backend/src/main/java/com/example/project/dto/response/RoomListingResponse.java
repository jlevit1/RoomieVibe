package com.example.project.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

import com.example.project.entity.Amenity;
import com.example.project.entity.ListingStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class RoomListingResponse {
    private Long id;
    private Long landlordId;
    private String landlordName;
    private String title;
    private String description;
    private BigDecimal price;
    private Double area;
    private String city;
    private String district;
    private String ward;
    private String address;
    private Double latitude;
    private Double longitude;
    private String contactPhone;
    private Integer maxOccupants;
    private Set<Amenity> amenities;
    private Set<String> imageUrls;
    private ListingStatus status;
    private String rejectReason;
    private Integer viewCount;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant expiresAt;
}
