package com.example.project.service;

import java.util.List;

import com.example.project.dto.response.NotificationResponse;
import com.example.project.entity.NotificationType;
import com.example.project.entity.User;

public interface NotificationService {

    void notify(User recipient, NotificationType type, String message, String link);

    List<NotificationResponse> getRecent(String email);

    long getUnreadCount(String email);

    void markRead(String email, Long id);

    void markAllRead(String email);
}
