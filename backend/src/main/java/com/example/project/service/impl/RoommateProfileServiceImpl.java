package com.example.project.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.project.dto.request.RoommateProfileRequest;
import com.example.project.dto.response.RoommateProfileResponse;
import com.example.project.entity.RoommateProfile;
import com.example.project.entity.User;
import com.example.project.exception.BadRequestException;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.repository.RoommateProfileRepository;
import com.example.project.repository.UserRepository;
import com.example.project.service.CompatibilityScorer;
import com.example.project.service.RoommateProfileService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoommateProfileServiceImpl implements RoommateProfileService {

    private static final int MIN_COMPATIBILITY_SCORE = 60;

    private final RoommateProfileRepository roommateProfileRepository;
    private final UserRepository userRepository;
    private final CompatibilityScorer compatibilityScorer;

    @Override
    public RoommateProfileResponse createOrUpdate(String email, RoommateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));

        RoommateProfile profile = roommateProfileRepository.findByUser(user)
                .orElseGet(() -> RoommateProfile.builder().user(user).build());

        applyRequest(profile, request);

        roommateProfileRepository.save(profile);
        return toResponse(profile, null, true);
    }

    @Override
    public RoommateProfileResponse getMine(String email) {
        RoommateProfile profile = findByEmailOrThrow(email);
        return toResponse(profile, null, true);
    }

    @Override
    public RoommateProfileResponse getById(String email, Long id) {
        RoommateProfile other = roommateProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so"));

        return findMyProfile(email)
                .map(myProfile -> myProfile.getId().equals(other.getId())
                        ? toResponse(other, null, true)
                        : toResponse(other, compatibilityScorer.score(myProfile, other), false))
                .orElseGet(() -> toResponse(other, null, false));
    }

    @Override
    public void deleteMine(String email) {
        RoommateProfile profile = findByEmailOrThrow(email);
        roommateProfileRepository.delete(profile);
    }

    @Override
    public List<RoommateProfileResponse> browse(String email) {
        Optional<RoommateProfile> myProfileOpt = findMyProfile(email);

        // Chua dang nhap hoac chua co ho so: xem duoc danh sach nhung khong tinh %
        if (myProfileOpt.isEmpty()) {
            return roommateProfileRepository.findAll().stream()
                    .sorted(Comparator.comparing(RoommateProfile::getCreatedAt).reversed())
                    .map(p -> toResponse(p, null, false))
                    .toList();
        }

        RoommateProfile myProfile = myProfileOpt.get();

        List<RoommateProfileResponse> others = roommateProfileRepository
                .findByUserIdNot(myProfile.getUser().getId()).stream()
                .map(other -> {
                    int score = compatibilityScorer.score(myProfile, other);
                    return toResponse(other, score, false);
                })
                .filter(res -> res.getCompatibilityScore() >= MIN_COMPATIBILITY_SCORE)
                .sorted(Comparator.comparingInt(RoommateProfileResponse::getCompatibilityScore).reversed())
                .toList();

        // Ho so cua chinh minh luon ghim dau danh sach, khong tinh % (tu so voi minh vo nghia)
        List<RoommateProfileResponse> result = new ArrayList<>();
        result.add(toResponse(myProfile, null, true));
        result.addAll(others);
        return result;
    }

    private RoommateProfile findByEmailOrThrow(String email) {
        return findMyProfile(email)
                .orElseThrow(() -> new BadRequestException("Ban can tao ho so truoc"));
    }

    private Optional<RoommateProfile> findMyProfile(String email) {
        if (email == null) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email).flatMap(roommateProfileRepository::findByUser);
    }

    private void applyRequest(RoommateProfile profile, RoommateProfileRequest request) {
        profile.setStatus(request.getStatus());
        profile.setCity(request.getCity());
        if (request.getDistricts() != null) {
            profile.setDistricts(request.getDistricts());
        }
        profile.setBudget(request.getBudget());
        profile.setMoveInDate(request.getMoveInDate());
        profile.setGender(request.getGender());
        profile.setPreferredGender(request.getPreferredGender());
        profile.setOccupation(request.getOccupation());
        profile.setPreferredOccupation(request.getPreferredOccupation());
        profile.setSleepSchedule(request.getSleepSchedule());
        profile.setCleanliness(request.getCleanliness());
        profile.setSmokes(Boolean.TRUE.equals(request.getSmokes()));
        profile.setAcceptsSmoking(request.getAcceptsSmoking() == null || request.getAcceptsSmoking());
        profile.setHasPet(Boolean.TRUE.equals(request.getHasPet()));
        profile.setAcceptsPets(request.getAcceptsPets() == null || request.getAcceptsPets());
        profile.setCooksAtHome(Boolean.TRUE.equals(request.getCooksAtHome()));
        if (request.getImageUrls() != null) {
            profile.setImageUrls(request.getImageUrls());
        }
        profile.setBio(request.getBio());
        profile.setContactPhone(request.getContactPhone());
    }

    private RoommateProfileResponse toResponse(RoommateProfile profile, Integer compatibilityScore, boolean own) {
        return RoommateProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .fullName(profile.getUser().getFullName())
                .status(profile.getStatus())
                .city(profile.getCity())
                .districts(profile.getDistricts())
                .budget(profile.getBudget())
                .moveInDate(profile.getMoveInDate())
                .gender(profile.getGender())
                .preferredGender(profile.getPreferredGender())
                .occupation(profile.getOccupation())
                .preferredOccupation(profile.getPreferredOccupation())
                .sleepSchedule(profile.getSleepSchedule())
                .cleanliness(profile.getCleanliness())
                .smokes(profile.getSmokes())
                .acceptsSmoking(profile.getAcceptsSmoking())
                .hasPet(profile.getHasPet())
                .acceptsPets(profile.getAcceptsPets())
                .cooksAtHome(profile.getCooksAtHome())
                .imageUrls(profile.getImageUrls())
                .bio(profile.getBio())
                .contactPhone(profile.getContactPhone())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .compatibilityScore(compatibilityScore)
                .own(own)
                .build();
    }
}
