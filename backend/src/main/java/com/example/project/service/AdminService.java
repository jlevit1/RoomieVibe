package com.example.project.service;

import java.util.List;

import com.example.project.dto.response.AdminStatsResponse;
import com.example.project.dto.response.UserResponse;

public interface AdminService {

    AdminStatsResponse getStats();

    List<UserResponse> getAllUsers();

    UserResponse lockUser(Long id);

    UserResponse unlockUser(Long id);
}
