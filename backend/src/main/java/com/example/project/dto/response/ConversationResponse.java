package com.example.project.dto.response;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ConversationResponse {
    private Long id;
    private String contextType;
    private Long contextId;
    private String viewerRole;
    private String contextTitle;
    private String contextThumbnail;
    private String otherPartyName;
    private String lastMessagePreview;
    private Instant lastMessageAt;
    private boolean unread;
}
