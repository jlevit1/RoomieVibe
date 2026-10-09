package com.example.project.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ListingMapPoint {
    private Long id;
    private String title;
    private String thumbnailUrl;
    private String district;
    private String city;
    private Double latitude;
    private Double longitude;
    private BigDecimal price;
}
