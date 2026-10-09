package com.example.project.service.impl;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.project.entity.ListingStatus;
import com.example.project.entity.NotificationType;
import com.example.project.entity.RoomListing;
import com.example.project.repository.RoomListingRepository;
import com.example.project.service.NotificationService;
import com.example.project.service.NotificationService.Mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Tells landlords a day before a paid boost ends, once per boost period. */
@Slf4j
@Component
@RequiredArgsConstructor
public class BoostExpiryNoticeJob {

    private static final Duration WARN_BEFORE = Duration.ofHours(24);

    private final RoomListingRepository roomListingRepository;
    private final NotificationService notificationService;

    @Scheduled(initialDelay = 2 * 60 * 1000, fixedDelay = 60 * 60 * 1000)
    @Transactional
    public void warnExpiringBoosts() {
        Instant now = Instant.now();
        List<RoomListing> expiring = roomListingRepository.findBoostsExpiringBetween(
                ListingStatus.HIEN_THI, now, now.plus(WARN_BEFORE));
        for (RoomListing listing : expiring) {
            String title = "\u201c" + listing.getTitle() + "\u201d";
            String endsAt = Formats.dateTime(listing.getPromotedUntil());
            notificationService.notifyWithMail(listing.getLandlord(), NotificationType.BOOST_EXPIRING,
                    "Gói đẩy tin của " + title + " sẽ hết hạn lúc " + endsAt, "/listings/mine",
                    new Mail("Gói đẩy tin của bạn sắp hết hạn",
                            List.of("Tin: " + title, "Hết hạn: " + endsAt,
                                    "Mua thêm trước thời điểm này thì ngày còn lại được cộng dồn, không mất ngày nào."),
                            "Gia hạn đẩy tin"));
            listing.setBoostExpiryNoticeFor(listing.getPromotedUntil());
        }
        if (!expiring.isEmpty()) {
            log.info("Sent boost-expiry notices for {} listing(s)", expiring.size());
        }
    }
}
