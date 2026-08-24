package com.example.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project.entity.ChatMessage;
import com.example.project.entity.Conversation;
import com.example.project.entity.DepositBooking;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationOrderByCreatedAtAsc(Conversation conversation);

    Optional<ChatMessage> findTopByConversationOrderByCreatedAtDesc(Conversation conversation);

    List<ChatMessage> findTop10ByConversationOrderByCreatedAtDesc(Conversation conversation);

    Optional<ChatMessage> findByDepositBooking(DepositBooking depositBooking);
}
