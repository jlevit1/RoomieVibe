package com.example.project.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project.dto.request.DisputeReasonRequest;
import com.example.project.dto.response.ChatMessageResponse;
import com.example.project.service.DepositService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/deposits")
@RequiredArgsConstructor
@Tag(name = "Deposit", description = "Dat coc xem nha thoa thuan qua chat")
public class DepositController {

    private final DepositService depositService;

    @PatchMapping("/{id}/pay")
    public ResponseEntity<ChatMessageResponse> pay(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(depositService.pay(authentication.getName(), id));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ChatMessageResponse> cancel(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(depositService.cancel(authentication.getName(), id));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ChatMessageResponse> complete(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(depositService.complete(authentication.getName(), id));
    }

    @PostMapping("/{id}/dispute")
    public ResponseEntity<ChatMessageResponse> dispute(
            Authentication authentication, @PathVariable Long id, @Valid @RequestBody DisputeReasonRequest request) {
        return ResponseEntity.ok(depositService.dispute(authentication.getName(), id, request.getReason()));
    }
}
