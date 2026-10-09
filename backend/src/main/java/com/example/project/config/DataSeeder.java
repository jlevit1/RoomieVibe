package com.example.project.config;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.project.entity.Amenity;
import com.example.project.entity.ChatMessage;
import com.example.project.entity.CleanlinessLevel;
import com.example.project.entity.Conversation;
import com.example.project.entity.DepositBooking;
import com.example.project.entity.DepositStatus;
import com.example.project.entity.FavoriteListing;
import com.example.project.entity.FavoriteRoommateProfile;
import com.example.project.entity.Gender;
import com.example.project.entity.ListingRental;
import com.example.project.entity.ListingReview;
import com.example.project.entity.ListingStatus;
import com.example.project.entity.MessageType;
import com.example.project.entity.Notification;
import com.example.project.entity.NotificationType;
import com.example.project.entity.Occupation;
import com.example.project.entity.Role;
import com.example.project.entity.RoomListing;
import com.example.project.entity.RoommateProfile;
import com.example.project.entity.RoommateStatus;
import com.example.project.entity.SleepSchedule;
import com.example.project.entity.User;
import com.example.project.entity.WalletTransaction;
import com.example.project.entity.WalletTransactionType;
import com.example.project.repository.ChatMessageRepository;
import com.example.project.repository.ConversationRepository;
import com.example.project.repository.DepositBookingRepository;
import com.example.project.repository.FavoriteListingRepository;
import com.example.project.repository.FavoriteRoommateProfileRepository;
import com.example.project.repository.ListingRentalRepository;
import com.example.project.repository.ListingReviewRepository;
import com.example.project.repository.NotificationRepository;
import com.example.project.repository.RoomListingRepository;
import com.example.project.repository.RoommateProfileRepository;
import com.example.project.repository.UserRepository;
import com.example.project.repository.WalletTransactionRepository;

import lombok.RequiredArgsConstructor;

/**
 * Chi chay khi chua co du lieu seed (kiem tra qua email danh dau), de tranh
 * tao trung lap moi lan restart backend. Tat bang app.seed.enabled=false
 * trong application-local.properties neu khong muon seed nua.
 *
 * Seed data phu tat ca cac tinh nang: tin dang co toa do that (cho ban do/heatmap),
 * 1 tai khoan admin, ho so tim ban o ghep, yeu thich, danh gia, so du vi + lich su
 * giao dich, hoi thoai + tin nhan, dat coc o du 4 trang thai, va thong bao.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String SEED_MARKER_EMAIL = "seed.landlord7@roomievibe.local";
    private static final String SEED_PASSWORD = "123456";

    private final UserRepository userRepository;
    private final RoomListingRepository roomListingRepository;
    private final RoommateProfileRepository roommateProfileRepository;
    private final FavoriteListingRepository favoriteListingRepository;
    private final FavoriteRoommateProfileRepository favoriteRoommateProfileRepository;
    private final ListingReviewRepository listingReviewRepository;
    private final ListingRentalRepository listingRentalRepository;
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DepositBookingRepository depositBookingRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail(SEED_MARKER_EMAIL).isPresent()) {
            log.info("DataSeeder: da co du lieu seed, bo qua.");
            return;
        }

        log.info("DataSeeder: bat dau tao du lieu test...");

        seedAdmin();
        List<User> landlords = seedLandlords();
        List<RoomListing> listings = seedListings(landlords);
        List<User> renters = seedRenters();
        seedRoommateProfiles(renters);
        seedFavorites(renters, listings);
        seedReviews(renters, listings);
        seedWalletTopUps(renters);
        seedConversationsMessagesAndDeposits(landlords, renters, listings);

        log.info("DataSeeder: xong - {} chu nha, {} tin dang, {} nguoi dung tim ban o ghep. Mat khau chung: {}",
                landlords.size(), listings.size(), renters.size(), SEED_PASSWORD);
    }

    // ---------- Admin ----------

    private void seedAdmin() {
        userRepository.save(buildUser("admin@gmail.com", "Quản trị viên hệ thống",
                "0900000000", Role.ADMIN, "admin@123"));
    }

    // ---------- Landlords + listings ----------

    private List<User> seedLandlords() {
        List<User> landlords = List.of(
                buildUser(SEED_MARKER_EMAIL, "Nguyễn Văn Hùng", "0901111222", Role.LANDLORD),
                buildUser("seed.landlord8@roomievibe.local", "Trần Thị Bích Ngọc", "0901111333", Role.LANDLORD),
                buildUser("seed.landlord9@roomievibe.local", "Lê Hoàng Phúc", "0901111444", Role.LANDLORD),
                buildUser("seed.landlord10@roomievibe.local", "Phạm Thị Thu Hà", "0901111555", Role.LANDLORD),
                buildUser("seed.landlord11@roomievibe.local", "Hoàng Minh Đức", "0901111666", Role.LANDLORD),
                buildUser("seed.landlord12@roomievibe.local", "Vương Thị Lan Anh", "0901111777", Role.LANDLORD));
        return userRepository.saveAll(landlords);
    }

    private List<RoomListing> seedListings(List<User> landlords) {
        User l0 = landlords.get(0); // Ha Noi
        User l1 = landlords.get(1); // TP.HCM
        User l2 = landlords.get(2); // Da Nang
        User l3 = landlords.get(3); // Can Tho
        User l4 = landlords.get(4); // Hai Phong
        User l5 = landlords.get(5); // Binh Duong

        List<ListingSeed> seeds = List.of(
                // ---- Ha Noi (l0) - kept close in price/amenities so the recommendation
                // engine has real matches to surface once listing 1 & 2 are favorited ----
                new ListingSeed(l0, "Phòng trọ Cầu Giấy đầy đủ nội thất, gần Đại học Quốc Gia",
                        "Phòng rộng rãi, thoáng mát, khu vực an ninh, gần các trường đại học và trung tâm thương mại.",
                        3_200_000, 22.0, "Hà Nội", "Cầu Giấy", "Ngõ 12 Trần Thái Tông",
                        21.0308, 105.7988, "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.NOI_THAT_DAY_DU, Amenity.KHOA_VAN_TAY),
                        ListingStatus.HIEN_THI, null, "hn-listing-1"),
                new ListingSeed(l0, "Căn hộ mini Đống Đa, ban công thoáng, gần chợ",
                        "Căn hộ mini 1 phòng ngủ, có ban công, gần chợ và bến xe bus.",
                        3_500_000, 26.0, "Hà Nội", "Đống Đa", "45 Tây Sơn",
                        21.0122, 105.8252, "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.MAY_GIAT, Amenity.THANG_MAY),
                        ListingStatus.HIEN_THI, null, "hn-listing-2"),
                new ListingSeed(l0, "Phòng trọ Hoàng Mai gần bến xe Giáp Bát",
                        "Tiện di chuyển, gần bến xe, siêu thị, giá hợp lý cho người đi làm.",
                        2_900_000, 19.0, "Hà Nội", "Hoàng Mai", "56 Giải Phóng",
                        20.9716, 105.8425, "0901111222", 1,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.MAY_GIAT, Amenity.THANG_MAY),
                        ListingStatus.HIEN_THI, null, "hn-listing-3"),
                new ListingSeed(l0, "Phòng trọ Hai Bà Trưng trung tâm, đi bộ ra hồ Gươm",
                        "Vị trí trung tâm, gần phố cổ, phù hợp người đi làm văn phòng.",
                        3_400_000, 20.0, "Hà Nội", "Hai Bà Trưng", "78 Bạch Mai",
                        21.0092, 105.8586, "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.CAMERA_AN_NINH),
                        ListingStatus.HIEN_THI, null, "hn-listing-4"),

                // ---- TP. Ho Chi Minh (l1) ----
                new ListingSeed(l1, "Phòng trọ Quận 1 trung tâm, gần chợ Bến Thành",
                        "Vị trí đắc địa, đi bộ ra phố đi bộ Nguyễn Huệ, an ninh 24/24.",
                        6_800_000, 24.0, "TP. Hồ Chí Minh", "Quận 1", "20 Nguyễn Trãi",
                        10.7756, 106.7019, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.BAO_VE_24_24, Amenity.THANG_MAY),
                        ListingStatus.HIEN_THI, null, "hcm-listing-1"),
                new ListingSeed(l1, "Phòng trọ Quận 10 gần Đại học Bách Khoa",
                        "Phòng sạch sẽ, chủ nhà thân thiện, giờ giấc tự do, có chỗ để xe.",
                        2_800_000, 18.0, "TP. Hồ Chí Minh", "Quận 10", "12 Sư Vạn Hạnh",
                        10.7726, 106.6669, "0901111333", 1,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO, Amenity.HAM_DE_XE),
                        ListingStatus.HIEN_THI, null, "hcm-listing-2"),
                new ListingSeed(l1, "Căn hộ dịch vụ Bình Thạnh full nội thất",
                        "Căn hộ dịch vụ cao cấp, bảo vệ 24/24, camera an ninh, gần cầu Sài Gòn.",
                        6_500_000, 32.0, "TP. Hồ Chí Minh", "Bình Thạnh", "88 Điện Biên Phủ",
                        10.8106, 106.7091, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.BAO_VE_24_24, Amenity.CAMERA_AN_NINH,
                                Amenity.NOI_THAT_DAY_DU),
                        ListingStatus.HIEN_THI, null, "hcm-listing-3"),
                new ListingSeed(l1, "Phòng trọ Gò Vấp giá rẻ cho sinh viên",
                        "Phòng nhỏ gọn, giá tốt, gần chợ Gò Vấp, phù hợp sinh viên.",
                        1_900_000, 14.0, "TP. Hồ Chí Minh", "Gò Vấp", "23 Quang Trung",
                        10.8386, 106.6652, "0901111333", 1,
                        Set.of(Amenity.WIFI, Amenity.KE_BEP),
                        ListingStatus.CHO_DUYET, null, "hcm-listing-4"),

                // ---- Da Nang (l2) ----
                new ListingSeed(l2, "Phòng trọ Hải Châu view sông Hàn",
                        "View đẹp, gần biển Mỹ Khê, thích hợp người đi làm.",
                        3_500_000, 24.0, "Đà Nẵng", "Hải Châu", "5 Bạch Đằng",
                        16.0678, 108.2208, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "dn-listing-1"),
                new ListingSeed(l2, "Phòng trọ Sơn Trà gần biển, 5 phút đi bộ",
                        "Cách biển 5 phút đi bộ, phù hợp người thích không gian yên tĩnh gần biển.",
                        4_000_000, 25.0, "Đà Nẵng", "Sơn Trà", "9 Võ Nguyên Giáp",
                        16.1057, 108.2559, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.KHOA_VAN_TAY),
                        ListingStatus.HIEN_THI, null, "dn-listing-2"),
                new ListingSeed(l2, "Nhà nguyên căn Thanh Khê cho thuê",
                        "Nhà 2 tầng, sân để xe rộng, khu dân cư yên tĩnh.",
                        7_000_000, 60.0, "Đà Nẵng", "Thanh Khê", "102 Điện Biên Phủ",
                        16.0592, 108.1955, "0901111444", 4,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.KHONG_CHUNG_CHU, Amenity.GAC),
                        ListingStatus.HIEN_THI, null, "dn-listing-3"),
                new ListingSeed(l2, "Phòng trọ Ngũ Hành Sơn gần Đại học FPT",
                        "Khu yên tĩnh, gần trường FPT và Non Nước, phù hợp sinh viên đi làm thêm.",
                        2_700_000, 20.0, "Đà Nẵng", "Ngũ Hành Sơn", "34 Trần Đại Nghĩa",
                        16.0016, 108.2477, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_GIAT, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "dn-listing-4"),

                // ---- Can Tho (l3) ----
                new ListingSeed(l3, "Phòng trọ Ninh Kiều gần Đại học Cần Thơ",
                        "Phòng thoáng mát, an ninh tốt, gần trường đại học và chợ đêm Cần Thơ.",
                        2_300_000, 20.0, "Cần Thơ", "Ninh Kiều", "77 Nguyễn Văn Cừ",
                        10.0333, 105.7833, "0901111555", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.BAO_VE_24_24),
                        ListingStatus.HIEN_THI, null, "ct-listing-1"),
                new ListingSeed(l3, "Phòng trọ Cái Răng gần chợ nổi",
                        "Gần chợ nổi Cái Răng, khu dân cư an ninh, giá tốt cho người đi làm.",
                        2_100_000, 18.0, "Cần Thơ", "Cái Răng", "15 Võ Tánh",
                        10.0125, 105.7469, "0901111555", 1,
                        Set.of(Amenity.WIFI, Amenity.KE_BEP),
                        ListingStatus.HIEN_THI, null, "ct-listing-2"),
                new ListingSeed(l3, "Căn hộ mini Ninh Kiều trung tâm thành phố",
                        "Căn hộ đầy đủ nội thất, gần bến Ninh Kiều, đi bộ ra trung tâm.",
                        3_000_000, 22.0, "Cần Thơ", "Ninh Kiều", "40 Hòa Bình",
                        10.0350, 105.7810, "0901111555", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.NOI_THAT_DAY_DU),
                        ListingStatus.HIEN_THI, null, "ct-listing-3"),
                new ListingSeed(l3, "Phòng trọ Bình Thủy giá sinh viên",
                        "Phòng nhỏ gọn, giá rẻ, gần sân bay Cần Thơ.",
                        1_600_000, 14.0, "Cần Thơ", "Bình Thủy", "8 Lê Hồng Phong",
                        10.0500, 105.7667, "0901111555", 1,
                        Set.of(Amenity.WIFI),
                        ListingStatus.CHO_DUYET, null, "ct-listing-4"),

                // ---- Hai Phong (l4) ----
                new ListingSeed(l4, "Căn hộ Hồng Bàng Hải Phòng full đồ",
                        "Căn hộ đầy đủ nội thất, gần trung tâm thành phố, tiện đi lại.",
                        3_800_000, 26.0, "Hải Phòng", "Hồng Bàng", "18 Điện Biên Phủ",
                        20.8561, 106.6822, "0901111666", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.MAY_GIAT, Amenity.NOI_THAT_DAY_DU,
                                Amenity.TU_LANH),
                        ListingStatus.HIEN_THI, null, "hp-listing-1"),
                new ListingSeed(l4, "Phòng trọ Ngô Quyền gần cảng Hải Phòng",
                        "Phòng sạch sẽ, gần khu công nghiệp và cảng, phù hợp người đi làm ca.",
                        2_400_000, 18.0, "Hải Phòng", "Ngô Quyền", "22 Lạch Tray",
                        20.8500, 106.6833, "0901111666", 1,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "hp-listing-2"),
                new ListingSeed(l4, "Phòng trọ Lê Chân trung tâm, gần chợ Sắt",
                        "Vị trí trung tâm, gần chợ và trường học, chủ nhà dễ tính.",
                        2_600_000, 19.0, "Hải Phòng", "Lê Chân", "5 Tô Hiệu",
                        20.8375, 106.6797, "0901111666", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH),
                        ListingStatus.HIEN_THI, null, "hp-listing-3"),
                new ListingSeed(l4, "Nhà nguyên căn Hải An sân vườn rộng",
                        "Nhà cấp 4 sân vườn rộng rãi, khu yên tĩnh, phù hợp gia đình nhỏ.",
                        5_500_000, 50.0, "Hải Phòng", "Hải An", "60 Nguyễn Bỉnh Khiêm",
                        20.8611, 106.7431, "0901111666", 4,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.KHONG_CHUNG_CHU),
                        ListingStatus.HIEN_THI, null, "hp-listing-4"),

                // ---- Binh Duong (l5) ----
                new ListingSeed(l5, "Phòng trọ Thủ Dầu Một gần khu công nghiệp VSIP",
                        "Phòng giá rẻ, gần khu công nghiệp VSIP, phù hợp công nhân viên.",
                        1_700_000, 16.0, "Bình Dương", "Thủ Dầu Một", "34 Cách Mạng Tháng Tám",
                        10.9804, 106.6519, "0901111777", 2,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "bd-listing-1"),
                new ListingSeed(l5, "Phòng trọ Dĩ An gần ga Sóng Thần",
                        "Gần ga Sóng Thần và khu công nghiệp, tiện di chuyển đi TP.HCM.",
                        1_800_000, 16.0, "Bình Dương", "Dĩ An", "11 Lý Thường Kiệt",
                        10.9083, 106.7667, "0901111777", 2,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE),
                        ListingStatus.HIEN_THI, null, "bd-listing-2"),
                new ListingSeed(l5, "Căn hộ Thuận An gần Aeon Mall Bình Dương",
                        "Căn hộ mới, đầy đủ nội thất, gần Aeon Mall và trường quốc tế.",
                        4_200_000, 28.0, "Bình Dương", "Thuận An", "99 Quốc lộ 13",
                        10.9167, 106.7000, "0901111777", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.NOI_THAT_DAY_DU, Amenity.THANG_MAY),
                        ListingStatus.HIEN_THI, null, "bd-listing-3"),
                new ListingSeed(l5, "Phòng trọ Tân Uyên giá tốt",
                        "Phòng gần khu công nghiệp, chưa có ảnh thật, hồ sơ đang bổ sung.",
                        1_500_000, 15.0, "Bình Dương", "Tân Uyên", "7 Đường ĐT747",
                        11.0647, 106.7000, "0901111777", 2,
                        Set.of(Amenity.WIFI),
                        ListingStatus.TU_CHOI, "Thiếu ảnh thật của phòng, vui lòng bổ sung và đăng lại",
                        "bd-listing-4"),

                // ---- Second wave: 2 more listings per landlord in different districts,
                // for a richer map/heatmap and more search-filter variety ----
                new ListingSeed(l0, "Phòng trọ Thanh Xuân gần Royal City",
                        "Phòng mới sửa, gần trung tâm thương mại Royal City, khu dân cư đông đúc.",
                        3_600_000, 23.0, "Hà Nội", "Thanh Xuân", "14 Nguyễn Trãi",
                        20.9971, 105.8058, "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.BAO_VE_24_24),
                        ListingStatus.HIEN_THI, null, "hn-listing-5"),
                new ListingSeed(l0, "Phòng trọ Long Biên view sông Hồng",
                        "Yên tĩnh, view sông, phù hợp người thích không gian thoáng đãng.",
                        2_700_000, 20.0, "Hà Nội", "Long Biên", "9 Ngọc Lâm",
                        21.0378, 105.8886, "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_GIAT, Amenity.KE_BEP),
                        ListingStatus.HIEN_THI, null, "hn-listing-6"),
                new ListingSeed(l1, "Căn hộ Quận 7 gần Phú Mỹ Hưng",
                        "Khu đô thị hiện đại, an ninh tốt, gần trường quốc tế và siêu thị.",
                        7_500_000, 35.0, "TP. Hồ Chí Minh", "Quận 7", "30 Nguyễn Lương Bằng",
                        10.7411, 106.7025, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.BAO_VE_24_24, Amenity.THANG_MAY,
                                Amenity.NOI_THAT_DAY_DU),
                        ListingStatus.HIEN_THI, null, "hcm-listing-5"),
                new ListingSeed(l1, "Phòng trọ Tân Bình gần sân bay",
                        "Gần sân bay Tân Sơn Nhất, tiện cho người làm ca đêm, có chỗ để xe.",
                        2_600_000, 17.0, "TP. Hồ Chí Minh", "Tân Bình", "56 Cộng Hòa",
                        10.8014, 106.6528, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "hcm-listing-6"),
                new ListingSeed(l2, "Phòng trọ Liên Chiểu gần khu công nghiệp",
                        "Giá rẻ, gần khu công nghiệp Hòa Khánh, phù hợp công nhân viên.",
                        1_800_000, 15.0, "Đà Nẵng", "Liên Chiểu", "21 Nguyễn Lương Bằng",
                        16.0736, 108.1497, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "dn-listing-5"),
                new ListingSeed(l2, "Căn hộ Cẩm Lệ mới xây full nội thất",
                        "Căn hộ mới bàn giao, đầy đủ nội thất, gần quốc lộ 1A.",
                        3_300_000, 24.0, "Đà Nẵng", "Cẩm Lệ", "10 Cách Mạng Tháng Tám",
                        16.0122, 108.2050, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.NOI_THAT_DAY_DU, Amenity.TU_LANH),
                        ListingStatus.HIEN_THI, null, "dn-listing-6"),
                new ListingSeed(l3, "Phòng trọ Thốt Nốt yên tĩnh giá rẻ",
                        "Khu vực yên tĩnh, giá rẻ, phù hợp người mới đi làm.",
                        1_500_000, 14.0, "Cần Thơ", "Thốt Nốt", "5 Nguyễn Văn Cừ nối dài",
                        10.2686, 105.5433, "0901111555", 1,
                        Set.of(Amenity.WIFI),
                        ListingStatus.HIEN_THI, null, "ct-listing-5"),
                new ListingSeed(l3, "Phòng trọ Ô Môn gần chợ",
                        "Gần chợ Ô Môn, khu dân cư an ninh, chủ nhà ở gần hỗ trợ nhanh.",
                        1_700_000, 16.0, "Cần Thơ", "Ô Môn", "18 Trần Hưng Đạo",
                        10.1103, 105.6264, "0901111555", 1,
                        Set.of(Amenity.WIFI, Amenity.KE_BEP),
                        ListingStatus.HIEN_THI, null, "ct-listing-6"),
                new ListingSeed(l4, "Phòng trọ Kiến An giá sinh viên",
                        "Gần trường Cao đẳng, giá tốt, chủ nhà thân thiện.",
                        1_900_000, 16.0, "Hải Phòng", "Kiến An", "3 Trần Thành Ngọ",
                        20.8014, 106.6236, "0901111666", 1,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "hp-listing-5"),
                new ListingSeed(l4, "Căn hộ Dương Kinh gần biển Đồ Sơn",
                        "Gần biển Đồ Sơn, không khí trong lành, phù hợp gia đình trẻ.",
                        3_100_000, 22.0, "Hải Phòng", "Dương Kinh", "27 Phạm Văn Đồng",
                        20.8083, 106.6667, "0901111666", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hp-listing-6"),
                new ListingSeed(l5, "Phòng trọ Bến Cát gần khu công nghiệp",
                        "Gần khu công nghiệp Bến Cát, giá tốt cho công nhân viên.",
                        1_600_000, 15.0, "Bình Dương", "Bến Cát", "12 Hùng Vương",
                        11.1167, 106.6167, "0901111777", 2,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE),
                        ListingStatus.HIEN_THI, null, "bd-listing-5"),
                new ListingSeed(l5, "Căn hộ Bàu Bàng mới xây",
                        "Căn hộ mới, gần khu công nghiệp Bàu Bàng, có chỗ để xe rộng.",
                        1_900_000, 18.0, "Bình Dương", "Bàu Bàng", "40 Đường ĐT741",
                        11.2833, 106.6167, "0901111777", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.HAM_DE_XE),
                        ListingStatus.HIEN_THI, null, "bd-listing-6"),

                // ---- Third wave: more listings per city (new districts + reused ones)
                // so there's a comfortable amount of test data (10+) per province ----
                new ListingSeed(l0, "Phòng trọ Ba Đình gần Lăng Bác",
                        "Vị trí trung tâm, gần Hồ Tây, khu vực yên tĩnh an ninh tốt.",
                        3_700_000, 22.0, "Hà Nội", "Ba Đình", "10 Ngọc Hà",
                        21.0359, 105.8342, "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.CAMERA_AN_NINH),
                        ListingStatus.HIEN_THI, null, "hn-listing-7"),
                new ListingSeed(l0, "Căn hộ Tây Hồ view hồ đẹp",
                        "Căn hộ cao cấp view Hồ Tây, đầy đủ nội thất, bảo vệ 24/24.",
                        5_500_000, 32.0, "Hà Nội", "Tây Hồ", "25 Xuân Diệu",
                        21.0587, 105.8231, "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.BAO_VE_24_24,
                                Amenity.NOI_THAT_DAY_DU),
                        ListingStatus.HIEN_THI, null, "hn-listing-8"),
                new ListingSeed(l0, "Phòng trọ Nam Từ Liêm gần sân vận động Mỹ Đình",
                        "Gần sân Mỹ Đình và các toà nhà văn phòng, tiện đi lại.",
                        2_900_000, 20.0, "Hà Nội", "Nam Từ Liêm", "18 Lê Đức Thọ",
                        21.0167, 105.7667, "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_GIAT, Amenity.THANG_MAY),
                        ListingStatus.HIEN_THI, null, "hn-listing-9"),
                new ListingSeed(l0, "Phòng trọ Bắc Từ Liêm giá sinh viên",
                        "Gần Đại học Thương Mại, giá rẻ phù hợp sinh viên.",
                        2_200_000, 16.0, "Hà Nội", "Bắc Từ Liêm", "7 Phạm Văn Đồng",
                        21.05, 105.7833, "0901111222", 1,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "hn-listing-10"),
                new ListingSeed(l0, "Nhà nguyên căn Hà Đông sân rộng",
                        "Nhà cấp 4 sân vườn, khu dân cư yên tĩnh, phù hợp gia đình nhỏ.",
                        3_300_000, 40.0, "Hà Nội", "Hà Đông", "33 Quang Trung",
                        20.9717, 105.7847, "0901111222", 3,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.KHONG_CHUNG_CHU),
                        ListingStatus.HIEN_THI, null, "hn-listing-11"),
                new ListingSeed(l0, "Phòng trọ Gia Lâm gần cầu Long Biên",
                        "Khu vực yên tĩnh, giá tốt, tiện di chuyển vào trung tâm.",
                        2_100_000, 17.0, "Hà Nội", "Gia Lâm", "5 Nguyễn Đức Thuận",
                        21.0378, 105.9333, "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.KE_BEP),
                        ListingStatus.HIEN_THI, null, "hn-listing-12"),

                new ListingSeed(l1, "Phòng trọ Bình Thạnh gần cầu Thị Nghè",
                        "Gần trung tâm, khu dân cư an ninh, tiện đi lại.",
                        4_100_000, 22.0, "TP. Hồ Chí Minh", "Bình Thạnh", "12 Xô Viết Nghệ Tĩnh",
                        10.8, 106.71, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.CAMERA_AN_NINH),
                        ListingStatus.HIEN_THI, null, "hcm-listing-10"),
                new ListingSeed(l1, "Phòng trọ Tân Phú giá sinh viên",
                        "Gần các trường đại học, giá rẻ, chủ nhà dễ tính.",
                        2_500_000, 16.0, "TP. Hồ Chí Minh", "Tân Phú", "8 Lũy Bán Bích",
                        10.79, 106.63, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "hcm-listing-11"),
                new ListingSeed(l1, "Căn hộ Quận 2 gần Thảo Điền",
                        "Căn hộ cao cấp khu Thảo Điền, đầy đủ tiện nghi.",
                        8_500_000, 40.0, "TP. Hồ Chí Minh", "Quận 2", "20 Trần Ngọc Diện",
                        10.8, 106.73, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.BAO_VE_24_24,
                                Amenity.NOI_THAT_DAY_DU),
                        ListingStatus.HIEN_THI, null, "hcm-listing-12"),

                new ListingSeed(l1, "Phòng trọ Quận 3 gần công viên Lê Văn Tám",
                        "Phòng sạch sẽ, gần công viên và chợ Bàn Cờ, an ninh khu phố tốt.",
                        3_200_000, 20.0, "TP. Hồ Chí Minh", "Quận 3", "22 Bà Huyện Thanh Quan",
                        10.786, 106.689, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.KE_BEP),
                        ListingStatus.HIEN_THI, null, "hcm-listing-7"),
                new ListingSeed(l1, "Căn hộ Thủ Đức gần Đại học Quốc gia",
                        "Căn hộ mới, gần làng đại học, tiện cho sinh viên và người đi làm.",
                        3_900_000, 24.0, "TP. Hồ Chí Minh", "Thủ Đức", "15 Võ Văn Ngân",
                        10.8494, 106.7717, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.BAO_VE_24_24),
                        ListingStatus.HIEN_THI, null, "hcm-listing-8"),
                new ListingSeed(l1, "Phòng trọ Phú Nhuận gần sân bay Tân Sơn Nhất",
                        "Vị trí thuận tiện di chuyển ra sân bay, khu dân cư yên tĩnh.",
                        4_500_000, 22.0, "TP. Hồ Chí Minh", "Phú Nhuận", "40 Phan Xích Long",
                        10.7991, 106.68, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_GIAT, Amenity.TU_LANH),
                        ListingStatus.HIEN_THI, null, "hcm-listing-9"),

                new ListingSeed(l2, "Nhà nguyên căn Hòa Vang yên tĩnh",
                        "Nhà cấp 4 sân vườn, khu vực yên tĩnh ngoại thành, giá tốt.",
                        2_200_000, 40.0, "Đà Nẵng", "Hòa Vang", "5 Đường ĐT602",
                        15.9967, 108.1289, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.KHONG_CHUNG_CHU),
                        ListingStatus.HIEN_THI, null, "dn-listing-7"),
                new ListingSeed(l2, "Phòng trọ Hải Châu gần chợ Cồn",
                        "Gần chợ Cồn và trung tâm thành phố, tiện đi lại, an ninh camera.",
                        3_100_000, 20.0, "Đà Nẵng", "Hải Châu", "30 Hùng Vương",
                        16.07, 108.21, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.CAMERA_AN_NINH),
                        ListingStatus.HIEN_THI, null, "dn-listing-8"),
                new ListingSeed(l2, "Căn hộ Sơn Trà view biển Mỹ Khê",
                        "Căn hộ cao cấp view biển, đầy đủ nội thất, bảo vệ 24/24.",
                        5_200_000, 30.0, "Đà Nẵng", "Sơn Trà", "88 Võ Nguyên Giáp",
                        16.048, 108.25, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.BAO_VE_24_24,
                                Amenity.NOI_THAT_DAY_DU),
                        ListingStatus.HIEN_THI, null, "dn-listing-9"),
                new ListingSeed(l2, "Phòng trọ Cẩm Lệ giá sinh viên",
                        "Phòng nhỏ gọn giá rẻ, gần quốc lộ 1A, phù hợp sinh viên.",
                        1_900_000, 16.0, "Đà Nẵng", "Cẩm Lệ", "20 Cách Mạng Tháng Tám",
                        16.008, 108.22, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "dn-listing-10"),

                new ListingSeed(l2, "Phòng trọ Thanh Khê gần biển Xuân Thiều",
                        "Gần biển, khu dân cư yên tĩnh, giá hợp lý.",
                        2_600_000, 18.0, "Đà Nẵng", "Thanh Khê", "40 Nguyễn Tất Thành",
                        16.06, 108.17, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH),
                        ListingStatus.HIEN_THI, null, "dn-listing-11"),
                new ListingSeed(l2, "Căn hộ Ngũ Hành Sơn gần Non Nước",
                        "Gần bãi biển Non Nước, đầy đủ nội thất.",
                        4_400_000, 28.0, "Đà Nẵng", "Ngũ Hành Sơn", "60 Trường Sa",
                        16.0, 108.25, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.NOI_THAT_DAY_DU),
                        ListingStatus.HIEN_THI, null, "dn-listing-12"),

                new ListingSeed(l3, "Nhà trọ Phong Điền gần chợ nổi Phong Điền",
                        "Khu vực ngoại thành yên tĩnh, gần chợ nổi, giá rẻ.",
                        1_400_000, 16.0, "Cần Thơ", "Phong Điền", "10 Đường Phong Điền",
                        10.0833, 105.65, "0901111555", 2,
                        Set.of(Amenity.WIFI),
                        ListingStatus.HIEN_THI, null, "ct-listing-7"),
                new ListingSeed(l3, "Phòng trọ Vĩnh Thạnh giá rẻ",
                        "Phòng đơn giản, giá tốt cho người mới đi làm.",
                        1_300_000, 14.0, "Cần Thơ", "Vĩnh Thạnh", "25 Đường Thạnh An",
                        10.2167, 105.4, "0901111555", 2,
                        Set.of(Amenity.WIFI, Amenity.KE_BEP),
                        ListingStatus.HIEN_THI, null, "ct-listing-8"),
                new ListingSeed(l3, "Phòng trọ Cờ Đỏ gần trung tâm huyện",
                        "Gần trung tâm hành chính huyện, tiện sinh hoạt.",
                        1_450_000, 15.0, "Cần Thơ", "Cờ Đỏ", "8 Đường Cờ Đỏ",
                        10.1333, 105.5333, "0901111555", 2,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "ct-listing-9"),
                new ListingSeed(l3, "Phòng trọ Thới Lai yên tĩnh",
                        "Khu dân cư yên tĩnh, giá rẻ, phù hợp gia đình nhỏ.",
                        1_350_000, 14.0, "Cần Thơ", "Thới Lai", "14 Đường Thới Lai",
                        10.1, 105.5, "0901111555", 2,
                        Set.of(Amenity.WIFI),
                        ListingStatus.HIEN_THI, null, "ct-listing-10"),
                new ListingSeed(l3, "Căn hộ Ninh Kiều gần bến Ninh Kiều",
                        "Căn hộ đầy đủ nội thất, trung tâm thành phố, gần bến Ninh Kiều.",
                        3_500_000, 26.0, "Cần Thơ", "Ninh Kiều", "60 Hai Bà Trưng",
                        10.03, 105.785, "0901111555", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.NOI_THAT_DAY_DU),
                        ListingStatus.HIEN_THI, null, "ct-listing-11"),
                new ListingSeed(l3, "Phòng trọ Cái Răng gần cầu Cái Răng",
                        "Gần cầu Cái Răng và chợ nổi, khu an ninh, giá hợp lý.",
                        2_000_000, 18.0, "Cần Thơ", "Cái Răng", "33 Đường Nguyễn Văn Linh",
                        10.01, 105.75, "0901111555", 2,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE),
                        ListingStatus.HIEN_THI, null, "ct-listing-12"),

                new ListingSeed(l4, "Phòng trọ Đồ Sơn gần biển",
                        "Gần biển Đồ Sơn, không khí trong lành, phù hợp gia đình trẻ.",
                        2_000_000, 18.0, "Hải Phòng", "Đồ Sơn", "7 Đường Vũ Yến",
                        20.73, 106.79, "0901111666", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH),
                        ListingStatus.HIEN_THI, null, "hp-listing-7"),
                new ListingSeed(l4, "Phòng trọ An Dương gần khu công nghiệp Tràng Duệ",
                        "Gần khu công nghiệp, phù hợp công nhân viên, giờ giấc tự do.",
                        1_800_000, 16.0, "Hải Phòng", "An Dương", "19 Đường Tôn Đức Thắng",
                        20.8667, 106.5833, "0901111666", 2,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "hp-listing-8"),
                new ListingSeed(l4, "Căn hộ Hồng Bàng gần chợ Sắt",
                        "Căn hộ trung tâm, gần chợ Sắt, bảo vệ 24/24, thang máy.",
                        4_200_000, 28.0, "Hải Phòng", "Hồng Bàng", "50 Điện Biên Phủ",
                        20.86, 106.68, "0901111666", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.BAO_VE_24_24),
                        ListingStatus.HIEN_THI, null, "hp-listing-9"),
                new ListingSeed(l4, "Phòng trọ Ngô Quyền gần bến xe Tam Bạc",
                        "Gần bến xe, tiện di chuyển, chủ nhà thân thiện.",
                        2_300_000, 17.0, "Hải Phòng", "Ngô Quyền", "11 Đà Nẵng",
                        20.848, 106.685, "0901111666", 2,
                        Set.of(Amenity.WIFI, Amenity.KE_BEP),
                        ListingStatus.HIEN_THI, null, "hp-listing-10"),
                new ListingSeed(l4, "Phòng trọ Lê Chân gần siêu thị Big C",
                        "Gần siêu thị và trường học, khu dân cư an ninh.",
                        2_500_000, 18.0, "Hải Phòng", "Lê Chân", "27 Trần Nguyên Hãn",
                        20.84, 106.675, "0901111666", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_GIAT),
                        ListingStatus.HIEN_THI, null, "hp-listing-11"),
                new ListingSeed(l4, "Nhà nguyên căn Kiến An sân rộng",
                        "Nhà cấp 4 sân vườn rộng, khu yên tĩnh, phù hợp gia đình.",
                        3_600_000, 45.0, "Hải Phòng", "Kiến An", "9 Trần Thành Ngọ",
                        20.805, 106.62, "0901111666", 2,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.GAC),
                        ListingStatus.HIEN_THI, null, "hp-listing-12"),

                new ListingSeed(l5, "Phòng trọ Phú Giáo gần khu công nghiệp",
                        "Gần khu công nghiệp, giá rẻ, phù hợp công nhân viên.",
                        1_450_000, 15.0, "Bình Dương", "Phú Giáo", "6 Đường ĐT741",
                        11.2, 106.7833, "0901111777", 2,
                        Set.of(Amenity.WIFI),
                        ListingStatus.HIEN_THI, null, "bd-listing-7"),
                new ListingSeed(l5, "Phòng trọ Dầu Tiếng giá rẻ",
                        "Khu vực yên tĩnh, giá tốt cho người mới đi làm.",
                        1_350_000, 14.0, "Bình Dương", "Dầu Tiếng", "13 Đường ĐT744",
                        11.2833, 106.6167, "0901111777", 2,
                        Set.of(Amenity.WIFI),
                        ListingStatus.HIEN_THI, null, "bd-listing-8"),
                new ListingSeed(l5, "Căn hộ Thủ Dầu Một gần chợ Thủ Dầu Một",
                        "Căn hộ đầy đủ nội thất, gần chợ trung tâm, thang máy.",
                        3_800_000, 26.0, "Bình Dương", "Thủ Dầu Một", "45 Yersin",
                        10.98, 106.65, "0901111777", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.NOI_THAT_DAY_DU),
                        ListingStatus.HIEN_THI, null, "bd-listing-9"),
                new ListingSeed(l5, "Phòng trọ Dĩ An gần chợ Dĩ An",
                        "Gần chợ và ga Dĩ An, tiện di chuyển đi TP.HCM.",
                        1_750_000, 16.0, "Bình Dương", "Dĩ An", "21 Đường Trần Hưng Đạo",
                        10.9, 106.77, "0901111777", 2,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE),
                        ListingStatus.HIEN_THI, null, "bd-listing-10"),
                new ListingSeed(l5, "Phòng trọ Thuận An giá sinh viên",
                        "Gần các khu công nghiệp và trường học, giờ giấc tự do.",
                        1_650_000, 15.0, "Bình Dương", "Thuận An", "17 Quốc lộ 13",
                        10.92, 106.705, "0901111777", 2,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, null, "bd-listing-11"),
                new ListingSeed(l5, "Phòng trọ Tân Uyên gần khu công nghiệp Nam Tân Uyên",
                        "Gần khu công nghiệp, giá tốt, chủ nhà dễ tính.",
                        1_550_000, 15.0, "Bình Dương", "Tân Uyên", "30 Đường ĐT747",
                        11.07, 106.705, "0901111777", 2,
                        Set.of(Amenity.WIFI, Amenity.KE_BEP),
                        ListingStatus.HIEN_THI, null, "bd-listing-12"),

                // ---- Fourth wave: pet-friendly listings in every city (there were none at
                // all in 3 of the 6 cities) so amenity-filtered searches have real coverage ----
                new ListingSeed(l0, "Phòng trọ Hoàn Kiếm cho nuôi thú cưng",
                        "Gần hồ Gươm, khu vực trung tâm, cho phép nuôi chó mèo.",
                        4_200_000, 22.0, "Hà Nội", "Hoàn Kiếm", "10 Hàng Bông",
                        21.0285, 105.8542, "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hn-listing-13"),
                new ListingSeed(l0, "Nhà nguyên căn Đông Anh sân vườn, cho nuôi chó mèo",
                        "Nhà cấp 4 sân vườn rộng, khu yên tĩnh ngoại thành, thoải mái nuôi thú cưng.",
                        2_800_000, 45.0, "Hà Nội", "Đông Anh", "25 Cao Lỗ",
                        21.1236, 105.8508, "0901111222", 3,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hn-listing-14"),
                new ListingSeed(l0, "Căn hộ Hoàng Mai cho nuôi thú cưng thoải mái",
                        "Căn hộ đầy đủ nội thất, gần bến xe Giáp Bát, cho nuôi thú cưng.",
                        3_100_000, 24.0, "Hà Nội", "Hoàng Mai", "60 Giải Phóng",
                        20.9716, 105.8425, "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.NOI_THAT_DAY_DU, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hn-listing-15"),
                new ListingSeed(l0, "Phòng trọ Sóc Sơn giá rẻ, cho nuôi thú cưng",
                        "Khu vực yên tĩnh, giá rẻ, chủ nhà dễ tính, cho nuôi thú cưng.",
                        1_900_000, 18.0, "Hà Nội", "Sóc Sơn", "8 Đường 131",
                        21.2536, 105.8402, "0901111222", 1,
                        Set.of(Amenity.WIFI, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hn-listing-16"),

                new ListingSeed(l1, "Nhà nguyên căn Nhà Bè sân rộng, cho nuôi thú cưng",
                        "Nhà cấp 4 sân vườn rộng rãi, khu dân cư yên tĩnh, cho nuôi chó mèo.",
                        3_500_000, 40.0, "TP. Hồ Chí Minh", "Nhà Bè", "15 Nguyễn Bình",
                        10.6958, 106.7397, "0901111333", 3,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hcm-listing-13"),
                new ListingSeed(l1, "Phòng trọ Bình Chánh giá rẻ, cho nuôi chó mèo",
                        "Giá rẻ, gần khu công nghiệp, chủ nhà thân thiện với thú cưng.",
                        2_000_000, 20.0, "TP. Hồ Chí Minh", "Bình Chánh", "30 Nguyễn Văn Linh",
                        10.6906, 106.5951, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hcm-listing-14"),
                new ListingSeed(l1, "Căn hộ Quận 4 cho nuôi thú cưng, gần trung tâm",
                        "Căn hộ hiện đại gần trung tâm Quận 1, cho phép nuôi thú cưng.",
                        4_800_000, 26.0, "TP. Hồ Chí Minh", "Quận 4", "22 Tôn Đản",
                        10.758, 106.7043, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hcm-listing-15"),
                new ListingSeed(l1, "Phòng trọ Quận 5 cho nuôi thú cưng thoải mái",
                        "Gần chợ An Đông, tiện di chuyển, cho nuôi thú cưng.",
                        3_300_000, 21.0, "TP. Hồ Chí Minh", "Quận 5", "40 Nguyễn Trãi",
                        10.7546, 106.6634, "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_GIAT, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hcm-listing-16"),

                new ListingSeed(l2, "Căn hộ Hải Châu view sông, cho nuôi thú cưng",
                        "Căn hộ view sông Hàn, đầy đủ nội thất, cho nuôi chó mèo.",
                        4_000_000, 25.0, "Đà Nẵng", "Hải Châu", "20 Bạch Đằng",
                        16.068, 108.22, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "dn-listing-13"),
                new ListingSeed(l2, "Phòng trọ Sơn Trà gần biển, cho nuôi chó mèo",
                        "Gần biển Mỹ Khê, không gian thoáng mát, cho nuôi thú cưng.",
                        3_200_000, 22.0, "Đà Nẵng", "Sơn Trà", "15 Hoàng Sa",
                        16.1, 108.26, "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "dn-listing-14"),
                new ListingSeed(l2, "Nhà nguyên căn Liên Chiểu sân vườn, cho nuôi thú cưng",
                        "Nhà cấp 4 sân vườn, khu công nghiệp Hòa Khánh, cho nuôi thú cưng.",
                        2_500_000, 42.0, "Đà Nẵng", "Liên Chiểu", "8 Nguyễn Lương Bằng",
                        16.07, 108.15, "0901111444", 3,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "dn-listing-15"),
                new ListingSeed(l2, "Phòng trọ Cẩm Lệ giá tốt, cho nuôi thú cưng",
                        "Giá tốt, gần quốc lộ 1A, chủ nhà thân thiện với thú cưng.",
                        1_800_000, 17.0, "Đà Nẵng", "Cẩm Lệ", "12 Cách Mạng Tháng Tám",
                        16.01, 108.21, "0901111444", 1,
                        Set.of(Amenity.WIFI, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "dn-listing-16"),

                new ListingSeed(l3, "Căn hộ Ninh Kiều trung tâm, cho nuôi thú cưng",
                        "Trung tâm thành phố, gần bến Ninh Kiều, cho nuôi chó mèo.",
                        3_400_000, 25.0, "Cần Thơ", "Ninh Kiều", "30 Hòa Bình",
                        10.035, 105.78, "0901111555", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "ct-listing-13"),
                new ListingSeed(l3, "Phòng trọ Cái Răng, cho nuôi chó mèo",
                        "Gần chợ nổi Cái Răng, khu an ninh, cho nuôi thú cưng.",
                        1_900_000, 18.0, "Cần Thơ", "Cái Răng", "10 Võ Tánh",
                        10.008, 105.755, "0901111555", 2,
                        Set.of(Amenity.WIFI, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "ct-listing-14"),
                new ListingSeed(l3, "Nhà nguyên căn Bình Thủy sân rộng, cho nuôi thú cưng",
                        "Nhà cấp 4 sân vườn rộng, khu yên tĩnh, cho nuôi thú cưng.",
                        2_200_000, 40.0, "Cần Thơ", "Bình Thủy", "5 Lê Hồng Phong",
                        10.06, 105.73, "0901111555", 3,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "ct-listing-15"),
                new ListingSeed(l3, "Phòng trọ Ô Môn giá rẻ, cho nuôi thú cưng",
                        "Giá rẻ, gần chợ Ô Môn, chủ nhà dễ tính với thú cưng.",
                        1_500_000, 15.0, "Cần Thơ", "Ô Môn", "20 Trần Hưng Đạo",
                        10.115, 105.63, "0901111555", 1,
                        Set.of(Amenity.WIFI, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "ct-listing-16"),

                new ListingSeed(l4, "Nhà nguyên căn Thủy Nguyên sân vườn, cho nuôi thú cưng",
                        "Nhà cấp 4 sân vườn rộng, khu ngoại thành yên tĩnh, cho nuôi thú cưng.",
                        2_600_000, 45.0, "Hải Phòng", "Thủy Nguyên", "18 Đường 359",
                        20.9167, 106.7333, "0901111666", 3,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hp-listing-13"),
                new ListingSeed(l4, "Phòng trọ An Lão giá rẻ, cho nuôi chó mèo",
                        "Giá rẻ, khu dân cư yên tĩnh, chủ nhà thân thiện với thú cưng.",
                        1_700_000, 16.0, "Hải Phòng", "An Lão", "9 Trường Chinh",
                        20.7667, 106.5333, "0901111666", 1,
                        Set.of(Amenity.WIFI, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hp-listing-14"),
                new ListingSeed(l4, "Căn hộ Hải An gần biển, cho nuôi thú cưng",
                        "Gần sân bay Cát Bi, đầy đủ nội thất, cho nuôi thú cưng.",
                        3_600_000, 24.0, "Hải Phòng", "Hải An", "27 Nguyễn Bỉnh Khiêm",
                        20.85, 106.75, "0901111666", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hp-listing-15"),
                new ListingSeed(l4, "Phòng trọ Ngô Quyền trung tâm, cho nuôi thú cưng",
                        "Trung tâm thành phố, gần chợ Sắt, cho nuôi thú cưng.",
                        2_800_000, 19.0, "Hải Phòng", "Ngô Quyền", "14 Đà Nẵng",
                        20.85, 106.69, "0901111666", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_GIAT, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "hp-listing-16"),

                new ListingSeed(l5, "Căn hộ Thủ Dầu Một cho nuôi thú cưng",
                        "Gần chợ Thủ Dầu Một, đầy đủ nội thất, cho nuôi chó mèo.",
                        3_500_000, 24.0, "Bình Dương", "Thủ Dầu Một", "20 Yersin",
                        10.98, 106.65, "0901111777", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "bd-listing-13"),
                new ListingSeed(l5, "Phòng trọ Dĩ An giá tốt, cho nuôi chó mèo",
                        "Gần ga Dĩ An, tiện di chuyển đi TP.HCM, cho nuôi thú cưng.",
                        1_800_000, 17.0, "Bình Dương", "Dĩ An", "11 Trần Hưng Đạo",
                        10.9, 106.77, "0901111777", 2,
                        Set.of(Amenity.WIFI, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "bd-listing-14"),
                new ListingSeed(l5, "Nhà nguyên căn Thuận An sân rộng, cho nuôi thú cưng",
                        "Nhà cấp 4 sân vườn rộng, gần Aeon Mall, cho nuôi thú cưng.",
                        2_700_000, 43.0, "Bình Dương", "Thuận An", "8 Quốc lộ 13",
                        10.92, 106.7, "0901111777", 3,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "bd-listing-15"),
                new ListingSeed(l5, "Phòng trọ Tân Uyên, cho nuôi thú cưng thoải mái",
                        "Gần khu công nghiệp Nam Tân Uyên, chủ nhà dễ tính với thú cưng.",
                        1_600_000, 15.0, "Bình Dương", "Tân Uyên", "5 Đường ĐT747",
                        11.07, 106.7, "0901111777", 1,
                        Set.of(Amenity.WIFI, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, null, "bd-listing-16"));

        List<RoomListing> saved = new ArrayList<>();
        for (ListingSeed s : seeds) {
            RoomListing listing = RoomListing.builder()
                    .landlord(s.landlord())
                    .title(s.title())
                    .description(s.description())
                    .price(BigDecimal.valueOf(s.price()))
                    .area(s.area())
                    .city(s.city())
                    .district(s.district())
                    .address(s.address())
                    .latitude(s.latitude())
                    .longitude(s.longitude())
                    .contactPhone(s.contactPhone())
                    .maxOccupants(s.maxOccupants())
                    .amenities(new LinkedHashSet<>(s.amenities()))
                    .imageUrls(roomPhotos(s.imageSeed(), 3, 900, 600))
                    .status(s.status())
                    .rejectReason(s.rejectReason())
                    .build();
            saved.add(roomListingRepository.save(listing));
        }
        return saved;
    }

    // ---------- Renters / roommate-seeking users ----------

    private List<User> seedRenters() {
        List<User> users = List.of(
                buildUser("seed.roommate10@roomievibe.local", "Đỗ Thị Ngọc Mai", "0902221111", Role.USER),
                buildUser("seed.roommate11@roomievibe.local", "Vũ Đình Khoa", "0902221112", Role.USER),
                buildUser("seed.roommate12@roomievibe.local", "Bùi Thị Kim Ngân", "0902221113", Role.USER),
                buildUser("seed.roommate13@roomievibe.local", "Ngô Quang Huy", "0902221114", Role.USER),
                buildUser("seed.roommate14@roomievibe.local", "Đặng Thị Thảo Vy", "0902221115", Role.USER),
                buildUser("seed.roommate15@roomievibe.local", "Phan Văn Tài", "0902221116", Role.USER),
                buildUser("seed.roommate16@roomievibe.local", "Lý Thị Hồng Nhung", "0902221117", Role.USER),
                buildUser("seed.roommate17@roomievibe.local", "Trịnh Minh Quân", "0902221118", Role.USER),
                buildUser("seed.roommate18@roomievibe.local", "Hồ Thị Diễm My", "0902221119", Role.USER),
                buildUser("seed.roommate19@roomievibe.local", "Đinh Văn Sơn", "0902221120", Role.USER),
                buildUser("seed.roommate20@roomievibe.local", "Lâm Thị Yến Nhi", "0902221121", Role.USER),
                buildUser("seed.roommate21@roomievibe.local", "Trương Quốc Bảo", "0902221122", Role.USER),
                buildUser("seed.roommate22@roomievibe.local", "Nguyễn Thị Thu Trang", "0902221123", Role.USER),
                buildUser("seed.roommate23@roomievibe.local", "Lê Văn Tuấn Anh", "0902221124", Role.USER),
                buildUser("seed.roommate24@roomievibe.local", "Phạm Thị Bích Thủy", "0902221125", Role.USER),
                buildUser("seed.roommate25@roomievibe.local", "Hoàng Đức Thịnh", "0902221126", Role.USER),
                buildUser("seed.roommate26@roomievibe.local", "Võ Thị Cẩm Tú", "0902221127", Role.USER),
                buildUser("seed.roommate27@roomievibe.local", "Đặng Minh Khang", "0902221128", Role.USER));
        return userRepository.saveAll(users);
    }

    private void seedRoommateProfiles(List<User> users) {
        List<ProfileSeed> seeds = List.of(
                new ProfileSeed(users.get(0), RoommateStatus.LOOKING_FOR_ROOM, "Hà Nội", Set.of("Cầu Giấy", "Đống Đa"),
                        3_000_000, Gender.FEMALE, Gender.FEMALE, Occupation.STUDENT, Occupation.STUDENT,
                        SleepSchedule.EARLY, CleanlinessLevel.HIGH, false, true, false, true, true,
                        "Sinh viên năm 3, thích sạch sẽ, hay nấu ăn tại nhà, tìm bạn nữ hợp tính.",
                        "0902221111", "seed-roommate-1"),
                new ProfileSeed(users.get(1), RoommateStatus.HAS_ROOM, "Hà Nội", Set.of("Cầu Giấy"),
                        3_500_000, Gender.MALE, null, Occupation.WORKING, null,
                        SleepSchedule.NORMAL, CleanlinessLevel.MEDIUM, false, true, true, true, false,
                        "Đang có phòng trống, nuôi 1 bé mèo, chấp nhận người nuôi thú cưng.",
                        "0902221112", "seed-roommate-2"),
                new ProfileSeed(users.get(2), RoommateStatus.LOOKING_FOR_ROOM, "TP. Hồ Chí Minh",
                        Set.of("Quận 10", "Quận 3"), 2_800_000, Gender.FEMALE, null, Occupation.STUDENT, null,
                        SleepSchedule.LATE, CleanlinessLevel.MEDIUM, false, true, false, true, false,
                        "Sinh viên năm cuối, thường thức khuya học bài, dễ tính trong sinh hoạt chung.",
                        "0902221113", "seed-roommate-3"),
                new ProfileSeed(users.get(3), RoommateStatus.LOOKING_FOR_ROOM, "TP. Hồ Chí Minh",
                        Set.of("Bình Thạnh"), 6_000_000, Gender.MALE, Gender.MALE, Occupation.WORKING,
                        Occupation.WORKING, SleepSchedule.NORMAL, CleanlinessLevel.HIGH, false, false, false, false,
                        true, "Nhân viên văn phòng, đi làm giờ hành chính, ưu tiên phòng gọn gàng yên tĩnh.",
                        "0902221114", "seed-roommate-4"),
                new ProfileSeed(users.get(4), RoommateStatus.LOOKING_FOR_ROOM, "Đà Nẵng", Set.of("Hải Châu", "Sơn Trà"),
                        3_200_000, Gender.FEMALE, Gender.FEMALE, Occupation.WORKING, null,
                        SleepSchedule.EARLY, CleanlinessLevel.HIGH, false, true, false, true, true,
                        "Làm marketing, dậy sớm tập gym, thích không gian sạch sẽ ngăn nắp.",
                        "0902221115", "seed-roommate-5"),
                new ProfileSeed(users.get(5), RoommateStatus.HAS_ROOM, "Đà Nẵng", Set.of("Thanh Khê"),
                        3_800_000, Gender.MALE, null, Occupation.WORKING, null,
                        SleepSchedule.LATE, CleanlinessLevel.LOW, true, true, false, true, false,
                        "Có phòng trống trong nhà nguyên căn, hút thuốc ngoài ban công, khá thoải mái.",
                        "0902221116", "seed-roommate-6"),
                new ProfileSeed(users.get(6), RoommateStatus.LOOKING_FOR_ROOM, "Cần Thơ", Set.of("Ninh Kiều"),
                        2_300_000, Gender.FEMALE, null, Occupation.STUDENT, null,
                        SleepSchedule.NORMAL, CleanlinessLevel.MEDIUM, false, true, false, true, true,
                        "Sinh viên Đại học Cần Thơ, thích nấu ăn, tìm bạn ở ghép vui vẻ hòa đồng.",
                        "0902221117", "seed-roommate-7"),
                new ProfileSeed(users.get(7), RoommateStatus.LOOKING_FOR_ROOM, "Hải Phòng", Set.of("Hồng Bàng"),
                        3_800_000, Gender.MALE, null, Occupation.WORKING, null,
                        SleepSchedule.NORMAL, CleanlinessLevel.MEDIUM, false, true, true, true, false,
                        "Kỹ sư IT làm việc từ xa, nuôi chó nhỏ, tìm bạn ở ghép yêu động vật.",
                        "0902221118", "seed-roommate-8"),
                new ProfileSeed(users.get(8), RoommateStatus.LOOKING_FOR_ROOM, "Bình Dương", Set.of("Thủ Dầu Một", "Dĩ An"),
                        1_800_000, Gender.FEMALE, Gender.FEMALE, Occupation.WORKING, null,
                        SleepSchedule.EARLY, CleanlinessLevel.HIGH, false, true, false, true, true,
                        "Làm công nhân khu công nghiệp VSIP, dậy sớm đi làm ca sáng, sống gọn gàng.",
                        "0902221119", "seed-roommate-9"),
                new ProfileSeed(users.get(9), RoommateStatus.LOOKING_FOR_ROOM, "Hà Nội", Set.of("Hoàng Mai", "Hai Bà Trưng"),
                        2_800_000, Gender.MALE, null, Occupation.WORKING, null,
                        SleepSchedule.NORMAL, CleanlinessLevel.MEDIUM, false, true, false, true, false,
                        "Nhân viên giao hàng, đi làm ca linh hoạt, dễ tính trong sinh hoạt chung.",
                        "0902221120", "seed-roommate-10"),
                new ProfileSeed(users.get(10), RoommateStatus.LOOKING_FOR_ROOM, "TP. Hồ Chí Minh", Set.of("Quận 1", "Bình Thạnh"),
                        5_000_000, Gender.FEMALE, Gender.FEMALE, Occupation.WORKING, null,
                        SleepSchedule.EARLY, CleanlinessLevel.HIGH, false, false, false, true, true,
                        "Làm ngân hàng, không hút thuốc, thích không gian yên tĩnh sạch sẽ.",
                        "0902221121", "seed-roommate-11"),
                new ProfileSeed(users.get(11), RoommateStatus.HAS_ROOM, "Cần Thơ", Set.of("Ninh Kiều", "Cái Răng"),
                        2_000_000, Gender.MALE, null, Occupation.STUDENT, null,
                        SleepSchedule.LATE, CleanlinessLevel.MEDIUM, false, true, false, true, true,
                        "Sinh viên có phòng trống, thức khuya làm đồ án, tìm bạn cùng ngành CNTT.",
                        "0902221122", "seed-roommate-12"),
                new ProfileSeed(users.get(12), RoommateStatus.LOOKING_FOR_ROOM, "Hà Nội", Set.of("Thanh Xuân", "Long Biên"),
                        3_300_000, Gender.FEMALE, Gender.FEMALE, Occupation.WORKING, null,
                        SleepSchedule.NORMAL, CleanlinessLevel.HIGH, false, true, false, true, true,
                        "Nhân viên thiết kế, làm việc tại nhà 2 ngày/tuần, thích không gian gọn gàng.",
                        "0902221123", "seed-roommate-13"),
                new ProfileSeed(users.get(13), RoommateStatus.LOOKING_FOR_ROOM, "TP. Hồ Chí Minh", Set.of("Quận 7", "Tân Bình"),
                        4_500_000, Gender.MALE, null, Occupation.WORKING, null,
                        SleepSchedule.LATE, CleanlinessLevel.MEDIUM, true, true, false, true, false,
                        "Làm ca đêm gần sân bay, hút thuốc ngoài ban công, khá dễ tính.",
                        "0902221124", "seed-roommate-14"),
                new ProfileSeed(users.get(14), RoommateStatus.HAS_ROOM, "Đà Nẵng", Set.of("Liên Chiểu", "Cẩm Lệ"),
                        2_200_000, Gender.FEMALE, Gender.FEMALE, Occupation.WORKING, null,
                        SleepSchedule.EARLY, CleanlinessLevel.HIGH, false, false, false, true, true,
                        "Công nhân khu công nghiệp Hòa Khánh, dậy sớm, không hút thuốc, thích nấu ăn chung.",
                        "0902221125", "seed-roommate-15"),
                new ProfileSeed(users.get(15), RoommateStatus.LOOKING_FOR_ROOM, "Cần Thơ", Set.of("Thốt Nốt", "Ô Môn"),
                        1_600_000, Gender.MALE, null, Occupation.STUDENT, null,
                        SleepSchedule.NORMAL, CleanlinessLevel.MEDIUM, false, true, true, true, false,
                        "Sinh viên cao đẳng, nuôi 1 chú chó nhỏ, tìm bạn ở ghép yêu thú cưng.",
                        "0902221126", "seed-roommate-16"),
                new ProfileSeed(users.get(16), RoommateStatus.LOOKING_FOR_ROOM, "Hải Phòng", Set.of("Kiến An", "Dương Kinh"),
                        2_000_000, Gender.FEMALE, null, Occupation.STUDENT, null,
                        SleepSchedule.EARLY, CleanlinessLevel.HIGH, false, true, false, true, true,
                        "Sinh viên cao đẳng y, dậy sớm thực tập, sống gọn gàng ngăn nắp.",
                        "0902221127", "seed-roommate-17"),
                new ProfileSeed(users.get(17), RoommateStatus.LOOKING_FOR_ROOM, "Bình Dương", Set.of("Bến Cát", "Bàu Bàng"),
                        1_700_000, Gender.MALE, Gender.MALE, Occupation.WORKING, null,
                        SleepSchedule.NORMAL, CleanlinessLevel.MEDIUM, false, true, false, true, false,
                        "Công nhân khu công nghiệp, đi làm theo ca, tìm bạn nam cùng công ty.",
                        "0902221128", "seed-roommate-18"));

        for (ProfileSeed s : seeds) {
            RoommateProfile profile = RoommateProfile.builder()
                    .user(s.user())
                    .status(s.status())
                    .city(s.city())
                    .districts(new LinkedHashSet<>(s.districts()))
                    .budget(BigDecimal.valueOf(s.budget()))
                    .moveInDate(LocalDate.now().plusDays(14))
                    .gender(s.gender())
                    .preferredGender(s.preferredGender())
                    .occupation(s.occupation())
                    .preferredOccupation(s.preferredOccupation())
                    .sleepSchedule(s.sleepSchedule())
                    .cleanliness(s.cleanliness())
                    .smokes(s.smokes())
                    .acceptsSmoking(s.acceptsSmoking())
                    .hasPet(s.hasPet())
                    .acceptsPets(s.acceptsPets())
                    .cooksAtHome(s.cooksAtHome())
                    .imageUrls(roomPhotos(s.imageSeed(), 2, 700, 700))
                    .bio(s.bio())
                    .contactPhone(s.contactPhone())
                    .build();
            roommateProfileRepository.save(profile);
        }
    }

    // ---------- Favorites (real signal for the recommendation engine) ----------

    private void seedFavorites(List<User> renters, List<RoomListing> listings) {
        // Renter 0 favorites 2 Ha Noi listings -> listings 0 & 3 (also Ha Noi,
        // similar price/amenities) should surface under "Co the ban quan tam".
        saveFavoriteListing(renters.get(0), listings.get(1));
        saveFavoriteListing(renters.get(0), listings.get(2));

        // Renter 2 favorites a HCM listing.
        saveFavoriteListing(renters.get(2), listings.get(6));

        // Renter 4 favorites a Da Nang listing.
        saveFavoriteListing(renters.get(4), listings.get(9));

        // Renter 12 favorites the other new Ha Noi listing -> listing 25 should
        // surface as a recommendation too (same city, close price/amenities).
        saveFavoriteListing(renters.get(12), listings.get(24));

        // Renter 13 favorites a new HCM listing.
        saveFavoriteListing(renters.get(13), listings.get(26));

        // Renter 7 favorites roommate profile of renter 1 (has a spare room in Ha Noi).
        RoommateProfile favoritedProfile = roommateProfileRepository.findByUser(renters.get(1)).orElse(null);
        if (favoritedProfile != null) {
            favoriteRoommateProfileRepository.save(FavoriteRoommateProfile.builder()
                    .user(renters.get(7))
                    .profile(favoritedProfile)
                    .build());
        }
    }

    private void saveFavoriteListing(User user, RoomListing listing) {
        favoriteListingRepository.save(FavoriteListing.builder().user(user).listing(listing).build());
    }

    // ---------- Reviews ----------

    private void seedReviews(List<User> renters, List<RoomListing> listings) {
        List<ReviewSeed> seeds = List.of(
                new ReviewSeed(renters.get(1), listings.get(0), 5, "Phòng sạch đẹp, chủ nhà nhiệt tình."),
                new ReviewSeed(renters.get(0), listings.get(1), 4, "Vị trí tiện, hơi ồn giờ cao điểm."),
                new ReviewSeed(renters.get(3), listings.get(4), 4, "Vị trí thuận tiện, hơi ồn về đêm."),
                new ReviewSeed(renters.get(2), listings.get(5), 5, "Chủ nhà phản hồi nhanh, phòng đúng như hình."),
                new ReviewSeed(renters.get(5), listings.get(8), 5, "View đẹp, giá hợp lý, rất đáng tiền."),
                new ReviewSeed(renters.get(6), listings.get(12), 3, "Phòng ổn nhưng hơi nhỏ so với mô tả."),
                new ReviewSeed(renters.get(9), listings.get(16), 4, "Đầy đủ nội thất như mô tả, ưng ý."),
                new ReviewSeed(renters.get(11), listings.get(20), 5, "Giá rẻ, gần chỗ làm, rất hài lòng."),
                new ReviewSeed(renters.get(12), listings.get(24), 5, "Gần Royal City, tiện ăn uống mua sắm."),
                new ReviewSeed(renters.get(13), listings.get(26), 4, "Căn hộ đẹp, hơi xa trung tâm một chút."),
                new ReviewSeed(renters.get(14), listings.get(28), 3, "Giá rẻ nhưng hơi ồn vì gần khu công nghiệp."),
                new ReviewSeed(renters.get(15), listings.get(30), 4, "Yên tĩnh, phù hợp người mới đi làm."),
                new ReviewSeed(renters.get(16), listings.get(32), 5, "Gần trường, giá tốt, chủ nhà dễ chịu."),
                new ReviewSeed(renters.get(17), listings.get(34), 4, "Gần khu công nghiệp, tiện đi làm ca."));

        for (ReviewSeed s : seeds) {
            // Reviews now require a real rental, so each seeded reviewer is also a recorded tenant.
            listingRentalRepository.save(ListingRental.builder().listing(s.listing()).tenant(s.user()).build());
            listingReviewRepository.save(ListingReview.builder()
                    .user(s.user())
                    .listing(s.listing())
                    .rating(s.rating())
                    .comment(s.comment())
                    .build());
        }
    }

    // ---------- Wallet top-ups ----------

    private void seedWalletTopUps(List<User> renters) {
        topUp(renters.get(0), 3_000_000);
        topUp(renters.get(2), 4_000_000);
        topUp(renters.get(3), 2_500_000);
        topUp(renters.get(4), 1_500_000);
        topUp(renters.get(6), 2_000_000);
        topUp(renters.get(8), 1_000_000);
        topUp(renters.get(12), 3_500_000);
        topUp(renters.get(15), 1_200_000);
    }

    private void topUp(User user, long amount) {
        BigDecimal amountBd = BigDecimal.valueOf(amount);
        user.setBalance(user.getBalance().add(amountBd));
        userRepository.save(user);
        walletTransactionRepository.save(WalletTransaction.builder()
                .user(user)
                .type(WalletTransactionType.NAP_TIEN)
                .amount(amountBd)
                .balanceAfter(user.getBalance())
                .build());
    }

    // ---------- Conversations, chat messages, deposits, notifications ----------

    private void seedConversationsMessagesAndDeposits(List<User> landlords, List<User> renters,
                                                        List<RoomListing> listings) {
        User landlordHN = landlords.get(0);
        User landlordHCM = landlords.get(1);
        User landlordDN = landlords.get(2);
        User landlordCT = landlords.get(3);
        User landlordHP = landlords.get(4);

        // Conversation A: plain text chat, Ha Noi listing, no deposit.
        Conversation convA = conversationRepository.save(Conversation.builder()
                .listing(listings.get(0)).renter(renters.get(0)).build());
        sendText(convA, renters.get(0), "Chào anh, phòng Cầu Giấy còn trống không ạ?");
        sendText(convA, landlordHN, "Chào bạn, phòng vẫn còn trống nhé, bạn muốn xem phòng lúc nào?");
        sendText(convA, renters.get(0), "Dạ cuối tuần này em qua xem được không anh?");
        notify(landlordHN, NotificationType.NEW_MESSAGE, "Tin nhắn mới từ " + renters.get(0).getFullName(),
                "/messages/" + convA.getId());

        // Conversation B: HCM listing, deposit already paid (DA_THANH_TOAN).
        Conversation convB = conversationRepository.save(Conversation.builder()
                .listing(listings.get(5)).renter(renters.get(2)).build());
        sendText(convB, renters.get(2), "Chị ơi phòng Quận 10 còn không ạ, em muốn đặt cọc giữ chỗ.");
        DepositBooking depositB = depositBookingRepository.save(DepositBooking.builder()
                .conversation(convB).amount(BigDecimal.valueOf(500_000))
                .status(DepositStatus.DA_THANH_TOAN).build());
        sendDepositRequest(convB, landlordHCM, depositB);
        deduct(renters.get(2), 500_000, WalletTransactionType.GIU_COC);
        notify(renters.get(2), NotificationType.DEPOSIT_REQUEST,
                "Yêu cầu đặt cọc 500000d", "/messages/" + convB.getId());

        // Conversation C: Da Nang listing, deposit still pending (CHO_THANH_TOAN).
        Conversation convC = conversationRepository.save(Conversation.builder()
                .listing(listings.get(8)).renter(renters.get(4)).build());
        sendText(convC, renters.get(4), "Anh ơi phòng Hải Châu xem được không ạ?");
        DepositBooking depositC = depositBookingRepository.save(DepositBooking.builder()
                .conversation(convC).amount(BigDecimal.valueOf(800_000))
                .status(DepositStatus.CHO_THANH_TOAN).build());
        sendDepositRequest(convC, landlordDN, depositC);
        notify(renters.get(4), NotificationType.DEPOSIT_REQUEST,
                "Yêu cầu đặt cọc 800000d", "/messages/" + convC.getId());

        // Conversation D: Can Tho listing, deposit disputed (TRANH_CHAP) - for the
        // admin dispute-resolution panel demo.
        Conversation convD = conversationRepository.save(Conversation.builder()
                .listing(listings.get(12)).renter(renters.get(6)).build());
        sendText(convD, renters.get(6), "Em đặt cọc xem phòng Ninh Kiều nhé anh.");
        DepositBooking depositD = depositBookingRepository.save(DepositBooking.builder()
                .conversation(convD).amount(BigDecimal.valueOf(300_000))
                .status(DepositStatus.TRANH_CHAP)
                .disputeReason("Chủ nhà không có mặt đúng giờ hẹn xem phòng").build());
        sendDepositRequest(convD, landlordCT, depositD);
        deduct(renters.get(6), 300_000, WalletTransactionType.GIU_COC);

        // Conversation E: Hai Phong listing, deposit fully completed (HOAN_THANH) -
        // funds already released to the landlord.
        Conversation convE = conversationRepository.save(Conversation.builder()
                .listing(listings.get(16)).renter(renters.get(3)).build());
        sendText(convE, renters.get(3), "Anh ơi em muốn đặt cọc giữ phòng Hồng Bàng.");
        DepositBooking depositE = depositBookingRepository.save(DepositBooking.builder()
                .conversation(convE).amount(BigDecimal.valueOf(600_000))
                .status(DepositStatus.HOAN_THANH).build());
        sendDepositRequest(convE, landlordHP, depositE);
        deduct(renters.get(3), 600_000, WalletTransactionType.GIU_COC);
        credit(landlordHP, 600_000, WalletTransactionType.NHAN_COC);

        // Conversation F: roommate-to-roommate chat (no listing/deposit involved).
        RoommateProfile hasRoomProfile = roommateProfileRepository.findByUser(renters.get(1)).orElse(null);
        if (hasRoomProfile != null) {
            Conversation convF = conversationRepository.save(Conversation.builder()
                    .roommateProfile(hasRoomProfile).renter(renters.get(7)).build());
            sendText(convF, renters.get(7), "Chào bạn, phòng bạn đăng còn nhận thêm người ở ghép không?");
            sendText(convF, renters.get(1), "Còn nhé, bạn nuôi thú cưng được không, mình có nuôi 1 bé mèo.");
        }

        // Listing approval/rejection notifications for the landlords' dashboards.
        notify(landlordHN, NotificationType.LISTING_APPROVED,
                "Tin đăng \"" + listings.get(0).getTitle() + "\" đã được duyệt", "/listings/mine");
        RoomListing rejectedListing = listings.get(listings.size() - 1);
        notify(rejectedListing.getLandlord(), NotificationType.LISTING_REJECTED,
                "Tin đăng \"" + rejectedListing.getTitle() + "\" bị từ chối: " + rejectedListing.getRejectReason(),
                "/listings/mine");
    }

    private void sendText(Conversation conversation, User sender, String content) {
        chatMessageRepository.save(ChatMessage.builder()
                .conversation(conversation).sender(sender).type(MessageType.TEXT).content(content).build());
    }

    private void sendDepositRequest(Conversation conversation, User sender, DepositBooking deposit) {
        chatMessageRepository.save(ChatMessage.builder()
                .conversation(conversation).sender(sender).type(MessageType.DEPOSIT_REQUEST)
                .depositBooking(deposit).build());
    }

    private void deduct(User user, long amount, WalletTransactionType type) {
        BigDecimal amountBd = BigDecimal.valueOf(amount);
        user.setBalance(user.getBalance().subtract(amountBd));
        userRepository.save(user);
        walletTransactionRepository.save(WalletTransaction.builder()
                .user(user).type(type).amount(amountBd).balanceAfter(user.getBalance()).build());
    }

    private void credit(User user, long amount, WalletTransactionType type) {
        BigDecimal amountBd = BigDecimal.valueOf(amount);
        user.setBalance(user.getBalance().add(amountBd));
        userRepository.save(user);
        walletTransactionRepository.save(WalletTransaction.builder()
                .user(user).type(type).amount(amountBd).balanceAfter(user.getBalance()).build());
    }

    private void notify(User recipient, NotificationType type, String message, String link) {
        notificationRepository.save(Notification.builder()
                .recipient(recipient).type(type).message(message).link(link).read(false).build());
    }

    // ---------- Helpers ----------

    private User buildUser(String email, String fullName, String phone, Role role) {
        return buildUser(email, fullName, phone, role, SEED_PASSWORD);
    }

    private User buildUser(String email, String fullName, String phone, Role role, String password) {
        return User.builder()
                .email(email)
                .fullName(fullName)
                .phone(phone)
                .password(passwordEncoder.encode(password))
                .role(role)
                .enabled(true)
                .build();
    }

    // Free-license Unsplash interiors; picked deterministically per seed key so reseeding gives the same photos.
    private static final List<String> ROOM_PHOTO_IDS = List.of(
            "1616594039964-ae9021a400a0", "1560185893-a55cbc8c57e8", "1616486029423-aaa4789e8c9a",
            "1629140727571-9b5c6f6267b4", "1601276174812-63280a55656e", "1552558636-f6a8f071c2b3",
            "1635594202056-9ea3b497e5c0", "1696762932825-2737db830bbe", "1616594092403-fb65629b0a46",
            "1612152605347-f93296cb657d", "1600210491305-7396500b5b31", "1625334782252-da92af3ad887",
            "1632829401795-2745c905ac77", "1560448205-4d9b3e6bb6db", "1702014859878-5d4743176d28",
            "1702014857653-dcea938d51f0", "1633505765486-e404bbbec654", "1585128792103-0b591f96512e",
            "1702014861736-d62834317c5e", "1531835551805-16d864c8d311", "1652882860938-f90aa298e644",
            "1702295297205-700e205030d0", "1722942116153-ee3aa0fc2153", "1758098491492-6501dfb2ae7d",
            "1781249144056-ec397e444dfa", "1786886393825-a2aff98f5f0a", "1723640582986-1c969ef540b3",
            "1721738857280-f4e7c1c43f2f", "1722942719131-2a208e55d72e", "1722605893285-06b8c018d348",
            "1702014862053-946a122b920d", "1665153515938-97aac6893f2c", "1522708323590-d24dbb6b0267",
            "1613575831056-0acd5da8f085", "1675279200694-8529c73b1fd0", "1589834390005-5d4fb9bf3d32",
            "1502672260266-1c1ef2d93688", "1502672023488-70e25813eb80", "1560448075-cbc16bb4af8e",
            "1745429523615-2a82c60bfc02");

    private Set<String> roomPhotos(String seedPrefix, int count, int width, int height) {
        Set<String> urls = new LinkedHashSet<>();
        int start = Math.floorMod(seedPrefix.hashCode(), ROOM_PHOTO_IDS.size());
        for (int i = 0; i < count; i++) {
            String id = ROOM_PHOTO_IDS.get((start + i * 7) % ROOM_PHOTO_IDS.size());
            urls.add("https://images.unsplash.com/photo-" + id + "?w=" + Math.max(width, height) * 4 / 3
                    + "&q=75&auto=format&fit=crop");
        }
        return urls;
    }

    private record ListingSeed(
            User landlord,
            String title,
            String description,
            long price,
            double area,
            String city,
            String district,
            String address,
            double latitude,
            double longitude,
            String contactPhone,
            int maxOccupants,
            Set<Amenity> amenities,
            ListingStatus status,
            String rejectReason,
            String imageSeed) {
    }

    private record ProfileSeed(
            User user,
            RoommateStatus status,
            String city,
            Set<String> districts,
            long budget,
            Gender gender,
            Gender preferredGender,
            Occupation occupation,
            Occupation preferredOccupation,
            SleepSchedule sleepSchedule,
            CleanlinessLevel cleanliness,
            boolean smokes,
            boolean acceptsSmoking,
            boolean hasPet,
            boolean acceptsPets,
            boolean cooksAtHome,
            String bio,
            String contactPhone,
            String imageSeed) {
    }

    private record ReviewSeed(User user, RoomListing listing, int rating, String comment) {
    }
}
