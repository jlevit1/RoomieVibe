package com.example.project.service;

import java.util.List;
import java.util.Set;

import com.example.project.dto.response.RoomListingResponse;
import com.example.project.dto.response.RoommateProfileResponse;

public interface FavoriteService {

    boolean toggleListingFavorite(String email, Long listingId);

    Set<Long> getMyFavoriteListingIds(String email);

    List<RoomListingResponse> getMyFavoriteListings(String email);

    boolean toggleRoommateFavorite(String email, Long profileId);

    Set<Long> getMyFavoriteRoommateProfileIds(String email);

    List<RoommateProfileResponse> getMyFavoriteRoommateProfiles(String email);
}
