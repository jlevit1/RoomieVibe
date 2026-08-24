package com.example.project.dto.response;

import java.time.Instant;

import com.example.project.entity.MessageType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ChatMessageResponse {
    private Long id;
    private Long conversationId;
    private MessageType type;
    private Long senderId;
    private String senderName;
    private String content;
    private Instant createdAt;
    private DepositBookingResponse deposit;
}
