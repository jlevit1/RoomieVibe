package com.example.project.service.impl;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.project.service.GeocodingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

// Goong resolves Vietnamese place names (even colloquial ones like "Lăng Bác") far better than generic geocoders.
@Service
public class GoongGeocodingServiceImpl implements GeocodingService {

    private static final Logger log = LoggerFactory.getLogger(GoongGeocodingServiceImpl.class);
    private static final String GEOCODE_URL = "https://rsapi.goong.io/geocode";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${goong.api-key:}")
    private String apiKey;

    @Override
    public Optional<GeoPlace> geocode(String query) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GeocodingService: goong.api-key chua duoc cau hinh");
            return Optional.empty();
        }

        String url = GEOCODE_URL
                + "?address=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&api_key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(
                    request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) {
                log.warn("GeocodingService: Goong tra ve status {}", response.statusCode());
                return Optional.empty();
            }

            JsonNode first = objectMapper.readTree(response.body()).path("results").path(0);
            JsonNode location = first.path("geometry").path("location");
            if (!location.hasNonNull("lat") || !location.hasNonNull("lng")) {
                return Optional.empty();
            }

            return Optional.of(new GeoPlace(
                    first.path("formatted_address").asText(query),
                    location.get("lat").asDouble(),
                    location.get("lng").asDouble()));
        } catch (IOException e) {
            log.warn("GeocodingService: goi Goong that bai", e);
            return Optional.empty();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        }
    }
}
