package com.example.project.service;

import java.util.Optional;

public interface GeocodingService {

    Optional<GeoPlace> geocode(String query);

    record GeoPlace(String address, double latitude, double longitude) {
    }
}
