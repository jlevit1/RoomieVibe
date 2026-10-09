package com.example.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LandmarkResponse {
    private String name;
    private String address;
    private double latitude;
    private double longitude;
    private double radiusKm;
}
