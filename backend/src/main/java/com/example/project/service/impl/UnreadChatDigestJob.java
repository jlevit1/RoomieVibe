package com.example.project.service.impl;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.project.entity.ChatMessage;
import com.example.project.entity.Conversation;
import com.example.project.entity.MessageType;
import com.example.project.entity.User;
import com.example.project.repository.ChatMessageRepository;
import com.example.project.repository.ConversationRepository;
import com.example.project.service.NotificationService;
import com.example.project.service.NotificationService.Mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Emails people about chat messages they have left unread for a while. One email per conversation per
 * "unread streak": after we email, nothing more is sent until the person has opened the conversation again.
 * Deposit requests are skipped here, they already trigger their own email.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UnreadChatDigestJob {

    private static final Duration QUIET_PERIOD = Duration.ofMinutes(15);
    private static final Duration LOOKBACK = Duration.ofHours(24);
    private static final int MAX_PREVIEWS = 3;
    private static final int PREVIEW_LENGTH = 140;

    private final ChatMessageRepository chatMessageRepository;
    private final ConversationRepository conversationRepository;
    private final NotificationService notificationService;

    @Scheduled(initialDelay = 60 * 1000, fixedDelay = 5 * 60 * 1000)
    @Transactional
    public void sendDigests() {
        Instant now = Instant.now();
        List<ChatMessage> recent = chatMessageRepository.findByTypeAndCreatedAtBetweenOrderByCreatedAtAsc(
                MessageType.TEXT, now.minus(LOOKBACK), now.minus(QUIET_PERIOD));

        // (conversation, which side is the recipient) -> that recipient's unread messages, oldest first
        Map<String, List<ChatMessage>> unreadByRecipient = new LinkedHashMap<>();
        for (ChatMessage message : recent) {
            Conversation conversation = message.getConversation();
            boolean recipientIsRenter = !isRenter(conversation, message.getSender());
            Instant lastRead = recipientIsRenter ? conversation.getRenterLastReadAt() : conversation.getLandlordLastReadAt();
            if (lastRead != null && !message.getCreatedAt().isAfter(lastRead)) continue;
            unreadByRecipient.computeIfAbsent(conversation.getId() + ":" + recipientIsRenter, k -> new ArrayList<>()).add(message);
        }

        int sent = 0;
        for (List<ChatMessage> unread : unreadByRecipient.values()) {
            if (sendDigest(unread, now)) sent++;
        }
        if (sent > 0) {
            log.info("Sent {} unread-chat email(s)", sent);
        }
    }

    private boolean sendDigest(List<ChatMessage> unread, Instant now) {
        ChatMessage first = unread.get(0);
        Conversation conversation = first.getConversation();
        User sender = first.getSender();
        boolean recipientIsRenter = !isRenter(conversation, sender);
        User recipient = recipientIsRenter ? conversation.getRenter() : otherParty(conversation);

        Instant lastRead = recipientIsRenter ? conversation.getRenterLastReadAt() : conversation.getLandlordLastReadAt();
        Instant emailedAt = recipientIsRenter ? conversation.getRenterEmailedAt() : conversation.getLandlordEmailedAt();
        boolean alreadyEmailedThisStreak = emailedAt != null && (lastRead == null || emailedAt.isAfter(lastRead));
        if (alreadyEmailedThisStreak) return false;

        String about = conversation.getListing() != null
                ? "\u201c" + conversation.getListing().getTitle() + "\u201d"
                : "hồ sơ tìm bạn ở ghép";
        String subject = unread.size() == 1
                ? "Bạn có tin nhắn chưa đọc từ " + sender.getFullName()
                : "Bạn có " + unread.size() + " tin nhắn chưa đọc từ " + sender.getFullName();

        List<String> previews = new ArrayList<>();
        int from = Math.max(0, unread.size() - MAX_PREVIEWS);
        for (ChatMessage message : unread.subList(from, unread.size())) {
            previews.add(sender.getFullName() + ": " + shorten(message.getContent()));
        }
        if (from > 0) previews.add(0, "... và " + from + " tin nhắn trước đó");

        notificationService.emailOnly(recipient,
                sender.getFullName() + " đã nhắn cho bạn về " + about + " và bạn chưa đọc.",
                "/messages/" + conversation.getId(), new Mail(subject, previews, "Mở tin nhắn"));

        if (recipientIsRenter) conversation.setRenterEmailedAt(now);
        else conversation.setLandlordEmailedAt(now);
        conversationRepository.save(conversation);
        return true;
    }

    private static boolean isRenter(Conversation conversation, User user) {
        return conversation.getRenter().getId().equals(user.getId());
    }

    private static User otherParty(Conversation conversation) {
        return conversation.getListing() != null
                ? conversation.getListing().getLandlord()
                : conversation.getRoommateProfile().getUser();
    }

    private static String shorten(String text) {
        if (text == null) return "";
        String oneLine = text.replaceAll("\\s+", " ").trim();
        return oneLine.length() <= PREVIEW_LENGTH ? oneLine : oneLine.substring(0, PREVIEW_LENGTH - 1) + "…";
    }
}
