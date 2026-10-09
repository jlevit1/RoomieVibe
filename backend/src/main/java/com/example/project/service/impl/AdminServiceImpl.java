package com.example.project.service.impl;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.example.project.dto.response.AdminAnalyticsResponse;
import com.example.project.dto.response.AdminChartPoint;
import com.example.project.dto.response.AdminStatsResponse;
import com.example.project.dto.response.UserResponse;
import com.example.project.entity.ListingStatus;
import com.example.project.entity.RoomListing;
import com.example.project.entity.Role;
import com.example.project.entity.User;
import com.example.project.entity.WalletTransaction;
import com.example.project.entity.WalletTransactionType;
import com.example.project.exception.BadRequestException;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.repository.RoomListingRepository;
import com.example.project.repository.UserRepository;
import com.example.project.repository.WalletTransactionRepository;
import com.example.project.service.AdminService;
import com.example.project.service.MailService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private static final ZoneId ZONE = ZoneId.systemDefault();
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final UserRepository userRepository;
    private final RoomListingRepository roomListingRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final MailService mailService;

    @Override
    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalLandlords(userRepository.countByRole(Role.LANDLORD))
                .totalListings(roomListingRepository.count())
                .pendingListings(roomListingRepository.countByStatus(ListingStatus.CHO_DUYET))
                .approvedListings(roomListingRepository.countByStatus(ListingStatus.HIEN_THI))
                .rejectedListings(roomListingRepository.countByStatus(ListingStatus.TU_CHOI))
                .rentedListings(roomListingRepository.countByStatus(ListingStatus.DA_CHO_THUE))
                .build();
    }

    @Override
    public AdminAnalyticsResponse getAnalytics(int days) {
        int safeDays = days > 0 ? days : 30;
        LocalDate today = LocalDate.now(ZONE);
        LocalDate startDate = today.minusDays(safeDays - 1L);
        Instant since = startDate.atStartOfDay(ZONE).toInstant();

        Map<LocalDate, Long> userCounts = emptyDayMap(startDate, today);
        for (User user : userRepository.findByCreatedAtAfter(since)) {
            LocalDate date = LocalDate.ofInstant(user.getCreatedAt(), ZONE);
            userCounts.merge(date, 1L, Long::sum);
        }

        Map<LocalDate, Long> listingCounts = emptyDayMap(startDate, today);
        for (RoomListing listing : roomListingRepository.findByCreatedAtAfter(since)) {
            LocalDate date = LocalDate.ofInstant(listing.getCreatedAt(), ZONE);
            listingCounts.merge(date, 1L, Long::sum);
        }

        Map<LocalDate, BigDecimal> topUpAmounts = emptyDayAmountMap(startDate, today);
        for (WalletTransaction tx : walletTransactionRepository
                .findByTypeAndCreatedAtAfter(WalletTransactionType.NAP_TIEN, since)) {
            LocalDate date = LocalDate.ofInstant(tx.getCreatedAt(), ZONE);
            topUpAmounts.merge(date, tx.getAmount(), BigDecimal::add);
        }

        return AdminAnalyticsResponse.builder()
                .userSignups(toCountPoints(userCounts))
                .listingSignups(toCountPoints(listingCounts))
                .walletTopUps(toAmountPoints(topUpAmounts))
                .build();
    }

    private Map<LocalDate, Long> emptyDayMap(LocalDate start, LocalDate end) {
        Map<LocalDate, Long> map = new LinkedHashMap<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            map.put(d, 0L);
        }
        return map;
    }

    private Map<LocalDate, BigDecimal> emptyDayAmountMap(LocalDate start, LocalDate end) {
        Map<LocalDate, BigDecimal> map = new LinkedHashMap<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            map.put(d, BigDecimal.ZERO);
        }
        return map;
    }

    private List<AdminChartPoint> toCountPoints(Map<LocalDate, Long> counts) {
        return counts.entrySet().stream()
                .map(e -> AdminChartPoint.builder()
                        .date(e.getKey().format(DATE_FORMAT))
                        .count(e.getValue())
                        .build())
                .toList();
    }

    private List<AdminChartPoint> toAmountPoints(Map<LocalDate, BigDecimal> amounts) {
        return amounts.entrySet().stream()
                .map(e -> AdminChartPoint.builder()
                        .date(e.getKey().format(DATE_FORMAT))
                        .amount(e.getValue())
                        .build())
                .toList();
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public UserResponse lockUser(Long id) {
        User user = findUserOrThrow(id);
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Khong the khoa tai khoan ADMIN");
        }
        boolean wasEnabled = Boolean.TRUE.equals(user.getEnabled());
        user.setEnabled(false);
        userRepository.save(user);
        if (wasEnabled) mailService.sendAccountLocked(user);
        return toResponse(user);
    }

    @Override
    public UserResponse unlockUser(Long id) {
        User user = findUserOrThrow(id);
        boolean wasLocked = !Boolean.TRUE.equals(user.getEnabled());
        user.setEnabled(true);
        userRepository.save(user);
        if (wasLocked) mailService.sendAccountUnlocked(user);
        return toResponse(user);
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .enabled(user.getEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
