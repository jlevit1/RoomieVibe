package com.example.project.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project.dto.request.CreateListingRequest;
import com.example.project.dto.request.RejectListingRequest;
import com.example.project.dto.response.RoomListingResponse;
import com.example.project.service.RoomListingService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
@Tag(name = "Room Listing", description = "Dang tin, duyet tin phong tro")
public class RoomListingController {

    private final RoomListingService roomListingService;

    @PostMapping
    @PreAuthorize("hasRole('LANDLORD')")
    public ResponseEntity<RoomListingResponse> create(Authentication authentication,
                                                        @Valid @RequestBody CreateListingRequest request) {
        return ResponseEntity.ok(roomListingService.create(authentication.getName(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomListingResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(roomListingService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('LANDLORD')")
    public ResponseEntity<RoomListingResponse> update(Authentication authentication,
                                                        @PathVariable Long id,
                                                        @Valid @RequestBody CreateListingRequest request) {
        return ResponseEntity.ok(roomListingService.update(authentication.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('LANDLORD')")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long id) {
        roomListingService.delete(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('LANDLORD')")
    public ResponseEntity<List<RoomListingResponse>> getMine(Authentication authentication) {
        return ResponseEntity.ok(roomListingService.getMine(authentication.getName()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RoomListingResponse>> getPending() {
        return ResponseEntity.ok(roomListingService.getPending());
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RoomListingResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(roomListingService.approve(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RoomListingResponse> reject(@PathVariable Long id,
                                                        @Valid @RequestBody RejectListingRequest request) {
        return ResponseEntity.ok(roomListingService.reject(id, request));
    }
}
