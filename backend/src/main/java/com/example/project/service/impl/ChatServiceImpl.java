package com.example.project.service.impl;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project.dto.response.ChatMessageResponse;
import com.example.project.dto.response.ConversationResponse;
import com.example.project.entity.ChatMessage;
import com.example.project.entity.Conversation;
import com.example.project.entity.DepositBooking;
import com.example.project.entity.MessageType;
import com.example.project.entity.RoomListing;
import com.example.project.entity.RoommateProfile;
import com.example.project.entity.User;
import com.example.project.exception.BadRequestException;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.repository.ChatMessageRepository;
import com.example.project.repository.ConversationRepository;
import com.example.project.repository.DepositBookingRepository;
import com.example.project.repository.RoomListingRepository;
import com.example.project.repository.RoommateProfileRepository;
import com.example.project.repository.UserRepository;
import com.example.project.service.ChatService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatServiceImpl implements ChatService {

    private static final int MAX_CONSECUTIVE_MESSAGES = 3;

    private final UserRepository userRepository;
    private final RoomListingRepository roomListingRepository;
    private final RoommateProfileRepository roommateProfileRepository;
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DepositBookingRepository depositBookingRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMapper chatMapper;

    @Override
    public ConversationResponse getOrCreateConversation(String email, Long listingId) {
        User user = findUser(email);
        RoomListing listing = findListing(listingId);

        if (listing.getLandlord().getId().equals(user.getId())) {
            throw new BadRequestException("Khong the tu nhan tin cho tin dang cua chinh minh");
        }

        Conversation conversation = conversationRepository.findByListingAndRenter(listing, user)
                .orElseGet(() -> conversationRepository.save(
                        Conversation.builder().listing(listing).renter(user).build()));

        return toConversationResponse(conversation, user);
    }

    @Override
    public ConversationResponse getOrCreateRoommateConversation(String email, Long profileId) {
        User user = findUser(email);
        RoommateProfile profile = findProfile(profileId);

        if (profile.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Khong the tu nhan tin cho ho so cua chinh minh");
        }

        Conversation conversation = conversationRepository.findByRoommateProfileAndRenter(profile, user)
                .orElseGet(() -> conversationRepository.save(
                        Conversation.builder().roommateProfile(profile).renter(user).build()));

        return toConversationResponse(conversation, user);
    }

    @Override
    public List<ConversationResponse> listMyConversations(String email) {
        User user = findUser(email);
        return findAllConversations(user).stream()
                .map(c -> toConversationResponse(c, user))
                .sorted(Comparator.comparing(
                        (ConversationResponse r) -> r.getLastMessageAt() != null ? r.getLastMessageAt() : Instant.EPOCH)
                        .reversed())
                .toList();
    }

    @Override
    public long getUnreadCount(String email) {
        User user = findUser(email);
        return findAllConversations(user).stream()
                .map(c -> toConversationResponse(c, user))
                .filter(ConversationResponse::isUnread)
                .count();
    }

    private List<Conversation> findAllConversations(User user) {
        List<Conversation> asRenter = conversationRepository.findByRenterOrderByCreatedAtDesc(user);
        List<Conversation> asLandlord = conversationRepository.findByListing_LandlordOrderByCreatedAtDesc(user);
        List<Conversation> asProfileOwner = conversationRepository.findByRoommateProfile_UserOrderByCreatedAtDesc(user);
        return Stream.concat(Stream.concat(asRenter.stream(), asLandlord.stream()), asProfileOwner.stream()).toList();
    }

    @Override
    public ConversationResponse getConversation(String email, Long conversationId) {
        User user = findUser(email);
        Conversation conversation = findConversation(conversationId);
        assertParticipant(conversation, user);
        return toConversationResponse(conversation, user);
    }

    @Override
    public List<ChatMessageResponse> getMessages(String email, Long conversationId) {
        User user = findUser(email);
        Conversation conversation = findConversation(conversationId);
        assertParticipant(conversation, user);
        markRead(conversation, user);

        return chatMessageRepository.findByConversationOrderByCreatedAtAsc(conversation).stream()
                .map(chatMapper::toMessageResponse)
                .toList();
    }

    private void markRead(Conversation conversation, User user) {
        boolean isRenter = conversation.getRenter().getId().equals(user.getId());
        if (isRenter) {
            conversation.setRenterLastReadAt(Instant.now());
        } else {
            conversation.setLandlordLastReadAt(Instant.now());
        }
        conversationRepository.save(conversation);
    }

    @Override
    public ChatMessageResponse sendTextMessage(String email, Long conversationId, String content) {
        User user = findUser(email);
        Conversation conversation = findConversation(conversationId);
        assertParticipant(conversation, user);
        assertNotSpamming(conversation, user);

        ChatMessage message = chatMessageRepository.save(ChatMessage.builder()
                .conversation(conversation)
                .sender(user)
                .type(MessageType.TEXT)
                .content(content)
                .build());

        return broadcast(message);
    }

    @Override
    public ChatMessageResponse createDepositRequest(String email, Long conversationId, BigDecimal amount) {
        User user = findUser(email);
        Conversation conversation = findConversation(conversationId);

        if (conversation.getListing() == null) {
            throw new BadRequestException("Chi ap dung dat coc cho tin dang phong tro");
        }
        if (!conversation.getListing().getLandlord().getId().equals(user.getId())) {
            throw new BadRequestException("Chi chu tin dang moi tao duoc yeu cau dat coc");
        }
        assertNotSpamming(conversation, user);

        DepositBooking depositBooking = depositBookingRepository.save(
                DepositBooking.builder().conversation(conversation).amount(amount).build());

        ChatMessage message = chatMessageRepository.save(ChatMessage.builder()
                .conversation(conversation)
                .sender(user)
                .type(MessageType.DEPOSIT_REQUEST)
                .depositBooking(depositBooking)
                .build());

        return broadcast(message);
    }

    private void assertNotSpamming(Conversation conversation, User sender) {
        List<ChatMessage> recent = chatMessageRepository.findTop10ByConversationOrderByCreatedAtDesc(conversation);
        int consecutive = 0;
        for (ChatMessage m : recent) {
            if (m.getSender().getId().equals(sender.getId())) {
                consecutive++;
            } else {
                break;
            }
        }
        if (consecutive >= MAX_CONSECUTIVE_MESSAGES) {
            throw new BadRequestException(
                    "Ban da gui " + MAX_CONSECUTIVE_MESSAGES + " tin lien tiep, vui long cho doi phuong phan hoi");
        }
    }

    private ChatMessageResponse broadcast(ChatMessage message) {
        ChatMessageResponse response = chatMapper.toMessageResponse(message);
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + message.getConversation().getId(), response);
        return response;
    }

    private void assertParticipant(Conversation conversation, User user) {
        boolean isRenter = conversation.getRenter().getId().equals(user.getId());
        boolean isOtherParty = otherPartyUser(conversation).getId().equals(user.getId());
        if (!isRenter && !isOtherParty) {
            throw new BadRequestException("Ban khong co quyen truy cap cuoc tro chuyen nay");
        }
    }

    private User otherPartyUser(Conversation conversation) {
        return conversation.getListing() != null
                ? conversation.getListing().getLandlord()
                : conversation.getRoommateProfile().getUser();
    }

    private ConversationResponse toConversationResponse(Conversation conversation, User currentUser) {
        boolean isRenter = conversation.getRenter().getId().equals(currentUser.getId());
        User otherParty = otherPartyUser(conversation);
        String otherPartyName = isRenter ? otherParty.getFullName() : conversation.getRenter().getFullName();

        boolean isListing = conversation.getListing() != null;
        String contextType = isListing ? "LISTING" : "ROOMMATE";
        Long contextId = isListing ? conversation.getListing().getId() : conversation.getRoommateProfile().getId();
        String contextTitle = isListing ? conversation.getListing().getTitle() : "Hồ sơ tìm bạn ở ghép";
        String contextThumbnail = isListing
                ? conversation.getListing().getImageUrls().stream().findFirst().orElse(null)
                : conversation.getRoommateProfile().getImageUrls().stream().findFirst().orElse(null);

        ChatMessage lastMessage = chatMessageRepository
                .findTopByConversationOrderByCreatedAtDesc(conversation).orElse(null);

        Instant myLastReadAt = isRenter ? conversation.getRenterLastReadAt() : conversation.getLandlordLastReadAt();
        boolean unread = lastMessage != null
                && !lastMessage.getSender().getId().equals(currentUser.getId())
                && (myLastReadAt == null || lastMessage.getCreatedAt().isAfter(myLastReadAt));

        return ConversationResponse.builder()
                .id(conversation.getId())
                .contextType(contextType)
                .contextId(contextId)
                .viewerRole(isRenter ? "RENTER" : "LANDLORD")
                .contextTitle(contextTitle)
                .contextThumbnail(contextThumbnail)
                .otherPartyName(otherPartyName)
                .lastMessagePreview(lastMessage != null ? chatMapper.previewOf(lastMessage) : null)
                .lastMessageAt(lastMessage != null ? lastMessage.getCreatedAt() : conversation.getCreatedAt())
                .unread(unread)
                .build();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }

    private RoomListing findListing(Long id) {
        return roomListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tin dang"));
    }

    private RoommateProfile findProfile(Long id) {
        return roommateProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so"));
    }

    private Conversation findConversation(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay cuoc tro chuyen"));
    }
}
