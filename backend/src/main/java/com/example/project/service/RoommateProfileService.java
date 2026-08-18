package com.example.project.service;

import java.util.List;

import com.example.project.dto.request.RoommateProfileRequest;
import com.example.project.dto.response.RoommateProfileResponse;

public interface RoommateProfileService {

    RoommateProfileResponse createOrUpdate(String email, RoommateProfileRequest request);

    RoommateProfileResponse getMine(String email);

    RoommateProfileResponse getById(String email, Long id);

    void deleteMine(String email);

    List<RoommateProfileResponse> browse(String email);
}
