package com.example.project.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project.dto.request.ResolveDisputeRequest;
import com.example.project.dto.response.AdminStatsResponse;
import com.example.project.dto.response.ChatMessageResponse;
import com.example.project.dto.response.DepositBookingResponse;
import com.example.project.dto.response.UserResponse;
import com.example.project.service.AdminService;
import com.example.project.service.DepositService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Thong ke, quan ly nguoi dung")
public class AdminController {

    private final AdminService adminService;
    private final DepositService depositService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PatchMapping("/users/{id}/lock")
    public ResponseEntity<UserResponse> lockUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.lockUser(id));
    }

    @PatchMapping("/users/{id}/unlock")
    public ResponseEntity<UserResponse> unlockUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.unlockUser(id));
    }

    @GetMapping("/deposits/disputes")
    public ResponseEntity<List<DepositBookingResponse>> listDisputedDeposits() {
        return ResponseEntity.ok(depositService.listDisputed());
    }

    @PatchMapping("/deposits/{id}/resolve")
    public ResponseEntity<ChatMessageResponse> resolveDispute(
            @PathVariable Long id, @Valid @RequestBody ResolveDisputeRequest request) {
        return ResponseEntity.ok(
                depositService.resolveDispute(id, Boolean.TRUE.equals(request.getReleaseToLandlord()), request.getNote()));
    }
}
