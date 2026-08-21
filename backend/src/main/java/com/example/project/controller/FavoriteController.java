package com.example.project.controller;

import java.util.List;
import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project.dto.response.FavoriteToggleResponse;
import com.example.project.dto.response.RoomListingResponse;
import com.example.project.dto.response.RoommateProfileResponse;
import com.example.project.service.FavoriteService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Tag(name = "Favorite", description = "Luu tin dang / ho so yeu thich")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/listings/{id}")
    public ResponseEntity<FavoriteToggleResponse> toggleListing(
            Authentication authentication, @PathVariable Long id) {
        boolean favorited = favoriteService.toggleListingFavorite(authentication.getName(), id);
        return ResponseEntity.ok(FavoriteToggleResponse.builder().favorited(favorited).build());
    }

    @GetMapping("/listings")
    public ResponseEntity<Set<Long>> getMyFavoriteListingIds(Authentication authentication) {
        return ResponseEntity.ok(favoriteService.getMyFavoriteListingIds(authentication.getName()));
    }

    @GetMapping("/listings/full")
    public ResponseEntity<List<RoomListingResponse>> getMyFavoriteListings(Authentication authentication) {
        return ResponseEntity.ok(favoriteService.getMyFavoriteListings(authentication.getName()));
    }

    @PostMapping("/roommate-profiles/{id}")
    public ResponseEntity<FavoriteToggleResponse> toggleRoommateProfile(
            Authentication authentication, @PathVariable Long id) {
        boolean favorited = favoriteService.toggleRoommateFavorite(authentication.getName(), id);
        return ResponseEntity.ok(FavoriteToggleResponse.builder().favorited(favorited).build());
    }

    @GetMapping("/roommate-profiles")
    public ResponseEntity<Set<Long>> getMyFavoriteRoommateProfileIds(Authentication authentication) {
        return ResponseEntity.ok(favoriteService.getMyFavoriteRoommateProfileIds(authentication.getName()));
    }

    @GetMapping("/roommate-profiles/full")
    public ResponseEntity<List<RoommateProfileResponse>> getMyFavoriteRoommateProfiles(
            Authentication authentication) {
        return ResponseEntity.ok(favoriteService.getMyFavoriteRoommateProfiles(authentication.getName()));
    }
}
