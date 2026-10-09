package com.example.project.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project.dto.response.NotificationResponse;
import com.example.project.dto.response.UnreadCountResponse;
import com.example.project.service.NotificationService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification", description = "Thong bao trong app")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getRecent(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getRecent(authentication.getName()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(Authentication authentication) {
        long count = notificationService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(UnreadCountResponse.builder().count(count).build());
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(Authentication authentication, @PathVariable Long id) {
        notificationService.markRead(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        notificationService.markAllRead(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
