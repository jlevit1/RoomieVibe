package com.example.project.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project.dto.request.CreateDepositRequestRequest;
import com.example.project.dto.request.SendMessageRequest;
import com.example.project.dto.response.ChatMessageResponse;
import com.example.project.dto.response.ConversationResponse;
import com.example.project.dto.response.UnreadCountResponse;
import com.example.project.service.ChatService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Nhan tin giua nguoi thue va chu nha, gan voi tin dang")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/conversations/{listingId}")
    public ResponseEntity<ConversationResponse> getOrCreateConversation(
            Authentication authentication, @PathVariable Long listingId) {
        return ResponseEntity.ok(chatService.getOrCreateConversation(authentication.getName(), listingId));
    }

    @PostMapping("/roommate-conversations/{profileId}")
    public ResponseEntity<ConversationResponse> getOrCreateRoommateConversation(
            Authentication authentication, @PathVariable Long profileId) {
        return ResponseEntity.ok(chatService.getOrCreateRoommateConversation(authentication.getName(), profileId));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> listMyConversations(Authentication authentication) {
        return ResponseEntity.ok(chatService.listMyConversations(authentication.getName()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(Authentication authentication) {
        long count = chatService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(UnreadCountResponse.builder().count(count).build());
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ConversationResponse> getConversation(
            Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(chatService.getConversation(authentication.getName(), id));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(chatService.getMessages(authentication.getName(), id));
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            Authentication authentication, @PathVariable Long id, @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.ok(chatService.sendTextMessage(authentication.getName(), id, request.getContent()));
    }

    @PostMapping("/conversations/{id}/deposit-request")
    public ResponseEntity<ChatMessageResponse> createDepositRequest(
            Authentication authentication, @PathVariable Long id,
            @Valid @RequestBody CreateDepositRequestRequest request) {
        return ResponseEntity.ok(
                chatService.createDepositRequest(authentication.getName(), id, request.getAmount()));
    }
}
