package com.example.project.service;

import java.util.List;

import com.example.project.dto.response.NotificationResponse;
import com.example.project.entity.NotificationType;
import com.example.project.entity.User;

public interface NotificationService {

    void notify(User recipient, NotificationType type, String message, String link);

    /** The email half of a notification: subject, optional bullet lines, and the button that opens {@code link}. */
    record Mail(String subject, List<String> details, String buttonLabel) {
    }

    /** Bell notification plus an email with the same message. The email is sent only after the transaction commits. */
    void notifyWithMail(User recipient, NotificationType type, String message, String link, Mail mail);

    /** Email only (e.g. a receipt for something the user just did themselves). Sent after the transaction commits. */
    void emailOnly(User recipient, String message, String link, Mail mail);

    List<NotificationResponse> getRecent(String email);

    long getUnreadCount(String email);

    void markRead(String email, Long id);

    void markAllRead(String email);
}
