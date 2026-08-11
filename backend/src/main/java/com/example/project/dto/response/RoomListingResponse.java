package com.example.project.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

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
    private String district;
    private String address;
    private Integer maxOccupants;
    private Set<String> amenities;
    private Set<String> imageUrls;
    private ListingStatus status;
    private String rejectReason;
    private Integer viewCount;
    private Instant createdAt;
    private Instant updatedAt;
}
