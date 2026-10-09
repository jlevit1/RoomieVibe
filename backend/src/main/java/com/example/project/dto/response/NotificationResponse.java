package com.example.project.dto.response;

import java.time.Instant;

import com.example.project.entity.NotificationType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private NotificationType type;
    private String message;
    private String link;
    private boolean read;
    private Instant createdAt;
}
