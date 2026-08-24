package com.example.project.service.impl;

import org.springframework.stereotype.Component;

import com.example.project.dto.response.ChatMessageResponse;
import com.example.project.dto.response.DepositBookingResponse;
import com.example.project.entity.ChatMessage;
import com.example.project.entity.DepositBooking;
import com.example.project.entity.MessageType;

@Component
public class ChatMapper {

    public ChatMessageResponse toMessageResponse(ChatMessage message) {
        DepositBookingResponse depositResponse = message.getDepositBooking() != null
                ? toDepositResponse(message.getDepositBooking())
                : null;

        return ChatMessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .type(message.getType())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .deposit(depositResponse)
                .build();
    }

    public DepositBookingResponse toDepositResponse(DepositBooking d) {
        return DepositBookingResponse.builder()
                .id(d.getId())
                .listingTitle(d.getConversation().getListing().getTitle())
                .renterName(d.getConversation().getRenter().getFullName())
                .landlordName(d.getConversation().getListing().getLandlord().getFullName())
                .amount(d.getAmount())
                .status(d.getStatus())
                .disputeReason(d.getDisputeReason())
                .resolutionNote(d.getResolutionNote())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    public String previewOf(ChatMessage message) {
        return message.getType() == MessageType.DEPOSIT_REQUEST ? "Yêu cầu đặt cọc" : message.getContent();
    }
}
