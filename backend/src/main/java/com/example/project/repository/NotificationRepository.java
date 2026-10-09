package com.example.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.project.entity.Notification;
import com.example.project.entity.User;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop20ByRecipientOrderByCreatedAtDesc(User recipient);

    long countByRecipientAndReadFalse(User recipient);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient = :recipient AND n.read = false")
    void markAllRead(@Param("recipient") User recipient);
}
