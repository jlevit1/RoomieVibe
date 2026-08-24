package com.example.project.security;

import java.security.Principal;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.example.project.repository.ConversationRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String CONVERSATION_TOPIC_PREFIX = "/topic/conversations/";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final ConversationRepository conversationRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            accessor.setUser(authenticate(accessor.getFirstNativeHeader("Authorization")));
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            authorizeSubscription(accessor);
        }

        return message;
    }

    private Principal authenticate(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new AccessDeniedException("Thieu token xac thuc");
        }
        String token = authHeader.substring(7);
        if (!jwtService.validateToken(token)) {
            throw new AccessDeniedException("Token khong hop le");
        }
        String email = jwtService.extractEmail(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        if (!userDetails.isEnabled()) {
            throw new AccessDeniedException("Tai khoan da bi khoa");
        }
        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }

    private void authorizeSubscription(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user == null) {
            throw new AccessDeniedException("Chua xac thuc");
        }

        Long conversationId = extractConversationId(accessor.getDestination());
        if (conversationId == null) {
            return;
        }

        String email = user.getName();
        boolean allowed = conversationRepository.existsByIdAndRenter_Email(conversationId, email)
                || conversationRepository.existsByIdAndListing_Landlord_Email(conversationId, email)
                || conversationRepository.existsByIdAndRoommateProfile_User_Email(conversationId, email);
        if (!allowed) {
            throw new AccessDeniedException("Khong co quyen truy cap cuoc tro chuyen nay");
        }
    }

    private Long extractConversationId(String destination) {
        if (destination == null || !destination.startsWith(CONVERSATION_TOPIC_PREFIX)) {
            return null;
        }
        try {
            return Long.parseLong(destination.substring(CONVERSATION_TOPIC_PREFIX.length()));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
