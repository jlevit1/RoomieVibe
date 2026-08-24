package com.example.project.service;

import java.math.BigDecimal;
import java.util.List;

import com.example.project.dto.response.ChatMessageResponse;
import com.example.project.dto.response.ConversationResponse;

public interface ChatService {

    ConversationResponse getOrCreateConversation(String email, Long listingId);

    ConversationResponse getOrCreateRoommateConversation(String email, Long profileId);

    List<ConversationResponse> listMyConversations(String email);

    long getUnreadCount(String email);

    ConversationResponse getConversation(String email, Long conversationId);

    List<ChatMessageResponse> getMessages(String email, Long conversationId);

    ChatMessageResponse sendTextMessage(String email, Long conversationId, String content);

    ChatMessageResponse createDepositRequest(String email, Long conversationId, BigDecimal amount);
}
