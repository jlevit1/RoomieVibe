package com.example.project.service.impl;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.project.dto.response.RoomListingResponse;
import com.example.project.dto.response.RoommateProfileResponse;
import com.example.project.entity.FavoriteListing;
import com.example.project.entity.FavoriteRoommateProfile;
import com.example.project.entity.RoomListing;
import com.example.project.entity.RoommateProfile;
import com.example.project.entity.User;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.repository.FavoriteListingRepository;
import com.example.project.repository.FavoriteRoommateProfileRepository;
import com.example.project.repository.RoomListingRepository;
import com.example.project.repository.RoommateProfileRepository;
import com.example.project.repository.UserRepository;
import com.example.project.service.FavoriteService;
import com.example.project.service.RoomListingService;
import com.example.project.service.RoommateProfileService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final UserRepository userRepository;
    private final RoomListingRepository roomListingRepository;
    private final RoommateProfileRepository roommateProfileRepository;
    private final FavoriteListingRepository favoriteListingRepository;
    private final FavoriteRoommateProfileRepository favoriteRoommateProfileRepository;
    private final RoomListingService roomListingService;
    private final RoommateProfileService roommateProfileService;

    @Override
    public boolean toggleListingFavorite(String email, Long listingId) {
        User user = findUser(email);
        RoomListing listing = roomListingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tin dang"));

        return favoriteListingRepository.findByUserAndListing(user, listing)
                .map(existing -> {
                    favoriteListingRepository.delete(existing);
                    return false;
                })
                .orElseGet(() -> {
                    favoriteListingRepository.save(
                            FavoriteListing.builder().user(user).listing(listing).build());
                    return true;
                });
    }

    @Override
    public Set<Long> getMyFavoriteListingIds(String email) {
        User user = findUser(email);
        return favoriteListingRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(f -> f.getListing().getId())
                .collect(Collectors.toSet());
    }

    @Override
    public List<RoomListingResponse> getMyFavoriteListings(String email) {
        User user = findUser(email);
        return favoriteListingRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(f -> {
                    try {
                        return roomListingService.getById(f.getListing().getId());
                    } catch (ResourceNotFoundException e) {
                        return null;
                    }
                })
                .filter(r -> r != null)
                .toList();
    }

    @Override
    public boolean toggleRoommateFavorite(String email, Long profileId) {
        User user = findUser(email);
        RoommateProfile profile = roommateProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so"));

        return favoriteRoommateProfileRepository.findByUserAndProfile(user, profile)
                .map(existing -> {
                    favoriteRoommateProfileRepository.delete(existing);
                    return false;
                })
                .orElseGet(() -> {
                    favoriteRoommateProfileRepository.save(
                            FavoriteRoommateProfile.builder().user(user).profile(profile).build());
                    return true;
                });
    }

    @Override
    public Set<Long> getMyFavoriteRoommateProfileIds(String email) {
        User user = findUser(email);
        return favoriteRoommateProfileRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(f -> f.getProfile().getId())
                .collect(Collectors.toSet());
    }

    @Override
    public List<RoommateProfileResponse> getMyFavoriteRoommateProfiles(String email) {
        return favoriteRoommateProfileRepository.findByUserOrderByCreatedAtDesc(findUser(email)).stream()
                .map(f -> {
                    try {
                        return roommateProfileService.getById(email, f.getProfile().getId());
                    } catch (ResourceNotFoundException e) {
                        return null;
                    }
                })
                .filter(r -> r != null)
                .toList();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }
}
