package com.example.project.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project.dto.request.RoommateProfileRequest;
import com.example.project.dto.response.RoommateProfileResponse;
import com.example.project.service.RoommateProfileService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/roommate-profiles")
@RequiredArgsConstructor
@Tag(name = "Roommate Profile", description = "Ho so tim ban o ghep, goi y theo do tuong thich")
public class RoommateProfileController {

    private final RoommateProfileService roommateProfileService;

    @PostMapping
    public ResponseEntity<RoommateProfileResponse> createOrUpdate(
            Authentication authentication, @Valid @RequestBody RoommateProfileRequest request) {
        return ResponseEntity.ok(
                roommateProfileService.createOrUpdate(authentication.getName(), request));
    }

    @GetMapping("/me")
    public ResponseEntity<RoommateProfileResponse> getMine(Authentication authentication) {
        return ResponseEntity.ok(roommateProfileService.getMine(authentication.getName()));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMine(Authentication authentication) {
        roommateProfileService.deleteMine(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/browse")
    public ResponseEntity<List<RoommateProfileResponse>> browse(Authentication authentication) {
        return ResponseEntity.ok(roommateProfileService.browse(emailOf(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoommateProfileResponse> getById(
            Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(roommateProfileService.getById(emailOf(authentication), id));
    }

    /** Tra ve email nguoi dang nhap, hoac null neu la khach chua dang nhap. */
    private String emailOf(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return authentication.getName();
    }
}
