package com.example.project.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.example.project.dto.response.NotificationResponse;
import com.example.project.entity.Notification;
import com.example.project.entity.NotificationType;
import com.example.project.entity.User;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.exception.UnauthorizedException;
import com.example.project.repository.NotificationRepository;
import com.example.project.repository.UserRepository;
import com.example.project.service.MailService;
import com.example.project.service.NotificationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final MailService mailService;

    @Override
    public void notify(User recipient, NotificationType type, String message, String link) {
        notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .type(type)
                .message(message)
                .link(link)
                .read(false)
                .build());
    }

    @Override
    public void notifyWithMail(User recipient, NotificationType type, String message, String link, Mail mail) {
        notify(recipient, type, message, link);
        emailOnly(recipient, message, link, mail);
    }

    @Override
    public void emailOnly(User recipient, String message, String link, Mail mail) {
        // Read everything we need now, while the Hibernate session is open: the send runs later on another thread.
        String toEmail = recipient.getEmail();
        String toName = recipient.getFullName();
        boolean enabled = Boolean.TRUE.equals(recipient.getEnabled());
        if (!enabled) return;
        afterCommit(() -> mailService.sendNotice(toEmail, toName, mail.subject(), message, mail.details(),
                mail.buttonLabel(), link));
    }

    // A rolled-back deposit/payment must not leave an email behind saying it happened.
    private void afterCommit(Runnable task) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    task.run();
                }
            });
        } else {
            task.run();
        }
    }

    @Override
    public List<NotificationResponse> getRecent(String email) {
        User user = findUser(email);
        return notificationRepository.findTop20ByRecipientOrderByCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public long getUnreadCount(String email) {
        return notificationRepository.countByRecipientAndReadFalse(findUser(email));
    }

    @Override
    public void markRead(String email, Long id) {
        User user = findUser(email);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay thong bao"));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new UnauthorizedException("Ban khong co quyen thao tac tren thong bao nay");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    public void markAllRead(String email) {
        notificationRepository.markAllRead(findUser(email));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .message(notification.getMessage())
                .link(notification.getLink())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
