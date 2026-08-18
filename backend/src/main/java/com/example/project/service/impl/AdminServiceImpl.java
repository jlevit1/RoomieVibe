package com.example.project.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.project.dto.response.AdminStatsResponse;
import com.example.project.dto.response.UserResponse;
import com.example.project.entity.ListingStatus;
import com.example.project.entity.Role;
import com.example.project.entity.User;
import com.example.project.exception.BadRequestException;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.repository.RoomListingRepository;
import com.example.project.repository.UserRepository;
import com.example.project.service.AdminService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final RoomListingRepository roomListingRepository;

    @Override
    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalLandlords(userRepository.countByRole(Role.LANDLORD))
                .totalListings(roomListingRepository.count())
                .pendingListings(roomListingRepository.countByStatus(ListingStatus.CHO_DUYET))
                .approvedListings(roomListingRepository.countByStatus(ListingStatus.HIEN_THI))
                .rejectedListings(roomListingRepository.countByStatus(ListingStatus.TU_CHOI))
                .build();
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public UserResponse lockUser(Long id) {
        User user = findUserOrThrow(id);
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Khong the khoa tai khoan ADMIN");
        }
        user.setEnabled(false);
        userRepository.save(user);
        return toResponse(user);
    }

    @Override
    public UserResponse unlockUser(Long id) {
        User user = findUserOrThrow(id);
        user.setEnabled(true);
        userRepository.save(user);
        return toResponse(user);
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .enabled(user.getEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
