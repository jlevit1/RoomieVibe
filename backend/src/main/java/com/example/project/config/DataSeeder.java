package com.example.project.config;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import com.example.project.entity.CleanlinessLevel;
import com.example.project.entity.Gender;
import com.example.project.entity.ListingStatus;
import com.example.project.entity.Occupation;
import com.example.project.entity.Role;
import com.example.project.entity.RoomListing;
import com.example.project.entity.RoommateProfile;
import com.example.project.entity.RoommateStatus;
import com.example.project.entity.SleepSchedule;
import com.example.project.entity.User;
import com.example.project.repository.RoomListingRepository;
import com.example.project.repository.RoommateProfileRepository;
import com.example.project.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Chi chay khi chua co du lieu seed (kiem tra qua email danh dau), de tranh
 * tao trung lap moi lan restart backend. Tat bang app.seed.enabled=false
 * trong application-local.properties neu khong muon seed nua.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String SEED_MARKER_EMAIL = "seed.landlord1@roomievibe.local";
    private static final String SEED_PASSWORD = "Test@1234";

    private final UserRepository userRepository;
    private final RoomListingRepository roomListingRepository;
    private final RoommateProfileRepository roommateProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail(SEED_MARKER_EMAIL).isPresent()) {
            log.info("DataSeeder: da co du lieu seed, bo qua.");
            return;
        }

        log.info("DataSeeder: bat dau tao du lieu test...");

        List<User> landlords = seedLandlords();
        int listingCount = seedListings(landlords);

        List<User> roommateUsers = seedRoommateUsers();
        int profileCount = seedRoommateProfiles(roommateUsers);

        log.info(
                "DataSeeder: xong - {} chu nha, {} tin dang, {} nguoi tim ban o ghep, {} ho so. Mat khau chung: {}",
                landlords.size(), listingCount, roommateUsers.size(), profileCount, SEED_PASSWORD);
    }

    // ---------- Landlords + listings ----------

    private List<User> seedLandlords() {
        List<User> landlords = List.of(
                buildUser(SEED_MARKER_EMAIL, "Nguyễn Văn Hùng", "0901111222", Role.LANDLORD),
                buildUser("seed.landlord2@roomievibe.local", "Trần Thị Bích Ngọc", "0901111333", Role.LANDLORD),
                buildUser("seed.landlord3@roomievibe.local", "Lê Hoàng Phúc", "0901111444", Role.LANDLORD),
                buildUser("seed.landlord4@roomievibe.local", "Phạm Thị Thu Hà", "0901111555", Role.LANDLORD));
        return userRepository.saveAll(landlords);
    }

    private int seedListings(List<User> landlords) {
        List<ListingSeed> seeds = List.of(
                new ListingSeed(landlords.get(0), "Phòng trọ mới xây gần Cầu Giấy, đầy đủ nội thất",
                        "Phòng rộng rãi, thoáng mát, khu vực an ninh, gần các trường đại học và trung tâm thương mại.",
                        3_200_000, 22.0, "Hà Nội", "Cầu Giấy", "Ngõ 12 Trần Thái Tông", "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.NOI_THAT_DAY_DU, Amenity.KHOA_VAN_TAY),
                        ListingStatus.HIEN_THI, "roomievibe-listing-1"),
                new ListingSeed(landlords.get(0), "Căn hộ mini Đống Đa, ban công thoáng",
                        "Căn hộ mini 1 phòng ngủ, có ban công, gần chợ và bến xe bus.",
                        4_500_000, 28.0, "Hà Nội", "Đống Đa", "45 Tây Sơn", "0901111222", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.MAY_GIAT, Amenity.THANG_MAY),
                        ListingStatus.HIEN_THI, "roomievibe-listing-2"),
                new ListingSeed(landlords.get(1), "Phòng trọ Quận 10 gần Đại học Bách Khoa",
                        "Phòng sạch sẽ, chủ nhà thân thiện, giờ giấc tự do, có chỗ để xe.",
                        2_800_000, 18.0, "TP. Hồ Chí Minh", "Quận 10", "12 Sư Vạn Hạnh", "0901111333", 1,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO, Amenity.HAM_DE_XE),
                        ListingStatus.HIEN_THI, "roomievibe-listing-3"),
                new ListingSeed(landlords.get(1), "Căn hộ dịch vụ Bình Thạnh full nội thất",
                        "Căn hộ dịch vụ cao cấp, bảo vệ 24/24, camera an ninh, gần cầu Sài Gòn.",
                        6_500_000, 32.0, "TP. Hồ Chí Minh", "Bình Thạnh", "88 Điện Biên Phủ", "0901111333", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.BAO_VE_24_24, Amenity.CAMERA_AN_NINH,
                                Amenity.NOI_THAT_DAY_DU),
                        ListingStatus.HIEN_THI, "roomievibe-listing-4"),
                new ListingSeed(landlords.get(1), "Phòng trọ Gò Vấp giá rẻ cho sinh viên",
                        "Phòng nhỏ gọn, giá tốt, gần chợ Gò Vấp, phù hợp sinh viên.",
                        1_900_000, 14.0, "TP. Hồ Chí Minh", "Gò Vấp", "23 Quang Trung", "0901111333", 1,
                        Set.of(Amenity.WIFI, Amenity.KE_BEP),
                        ListingStatus.CHO_DUYET, "roomievibe-listing-5"),
                new ListingSeed(landlords.get(2), "Phòng trọ Hải Châu view sông Hàn",
                        "View đẹp, gần biển Mỹ Khê, thích hợp người đi làm.",
                        3_500_000, 24.0, "Đà Nẵng", "Hải Châu", "5 Bạch Đằng", "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.THANG_MAY, Amenity.CHO_NUOI_THU_CUNG),
                        ListingStatus.HIEN_THI, "roomievibe-listing-6"),
                new ListingSeed(landlords.get(2), "Nhà nguyên căn Thanh Khê cho thuê",
                        "Nhà 2 tầng, sân để xe rộng, khu dân cư yên tĩnh.",
                        7_000_000, 60.0, "Đà Nẵng", "Thanh Khê", "102 Điện Biên Phủ", "0901111444", 4,
                        Set.of(Amenity.WIFI, Amenity.HAM_DE_XE, Amenity.KHONG_CHUNG_CHU, Amenity.GAC),
                        ListingStatus.HIEN_THI, "roomievibe-listing-7"),
                new ListingSeed(landlords.get(3), "Phòng trọ Ninh Kiều gần Đại học Cần Thơ",
                        "Phòng thoáng mát, an ninh tốt, gần trường đại học và chợ đêm Cần Thơ.",
                        2_300_000, 20.0, "Cần Thơ", "Ninh Kiều", "77 Nguyễn Văn Cừ", "0901111555", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.BAO_VE_24_24),
                        ListingStatus.HIEN_THI, "roomievibe-listing-8"),
                new ListingSeed(landlords.get(3), "Căn hộ Hồng Bàng Hải Phòng full đồ",
                        "Căn hộ đầy đủ nội thất, gần trung tâm thành phố, tiện đi lại.",
                        3_800_000, 26.0, "Hải Phòng", "Hồng Bàng", "18 Điện Biên Phủ", "0901111555", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.MAY_GIAT, Amenity.NOI_THAT_DAY_DU,
                                Amenity.TU_LANH),
                        ListingStatus.HIEN_THI, "roomievibe-listing-9"),
                new ListingSeed(landlords.get(3), "Phòng trọ Thủ Dầu Một gần khu công nghiệp",
                        "Phòng giá rẻ, gần khu công nghiệp VSIP, phù hợp công nhân viên.",
                        1_700_000, 16.0, "Bình Dương", "Thủ Dầu Một", "34 Cách Mạng Tháng Tám", "0901111555", 2,
                        Set.of(Amenity.WIFI, Amenity.GIO_GIAC_TU_DO),
                        ListingStatus.HIEN_THI, "roomievibe-listing-10"),
                new ListingSeed(landlords.get(2), "Phòng trọ Sơn Trà gần biển",
                        "Cách biển 5 phút đi bộ, phù hợp người thích không gian yên tĩnh gần biển.",
                        4_000_000, 25.0, "Đà Nẵng", "Sơn Trà", "9 Võ Nguyên Giáp", "0901111444", 2,
                        Set.of(Amenity.WIFI, Amenity.MAY_LANH, Amenity.KHOA_VAN_TAY),
                        ListingStatus.TU_CHOI, "roomievibe-listing-11"),
                new ListingSeed(landlords.get(0), "Phòng trọ Hoàng Mai gần bến xe Giáp Bát",
                        "Tiện di chuyển, gần bến xe, siêu thị, giá hợp lý cho người đi làm.",
                        2_600_000, 19.0, "Hà Nội", "Hoàng Mai", "56 Giải Phóng", "0901111222", 1,
                        Set.of(Amenity.WIFI, Amenity.MAY_GIAT, Amenity.THANG_MAY),
                        ListingStatus.HIEN_THI, "roomievibe-listing-12"));

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
                    .contactPhone(s.contactPhone())
                    .maxOccupants(s.maxOccupants())
                    .amenities(new LinkedHashSet<>(s.amenities()))
                    .imageUrls(picsumImages(s.imageSeed(), 3, 900, 600))
                    .status(s.status())
                    .build();
            roomListingRepository.save(listing);
        }
        return seeds.size();
    }

    // ---------- Roommate-seeking users + profiles ----------

    private List<User> seedRoommateUsers() {
        List<User> users = List.of(
                buildUser("seed.roommate1@roomievibe.local", "Đỗ Thị Ngọc Mai", "0902221111", Role.USER),
                buildUser("seed.roommate2@roomievibe.local", "Vũ Đình Khoa", "0902221112", Role.USER),
                buildUser("seed.roommate3@roomievibe.local", "Bùi Thị Kim Ngân", "0902221113", Role.USER),
                buildUser("seed.roommate4@roomievibe.local", "Ngô Quang Huy", "0902221114", Role.USER),
                buildUser("seed.roommate5@roomievibe.local", "Đặng Thị Thảo Vy", "0902221115", Role.USER),
                buildUser("seed.roommate6@roomievibe.local", "Phan Văn Tài", "0902221116", Role.USER),
                buildUser("seed.roommate7@roomievibe.local", "Lý Thị Hồng Nhung", "0902221117", Role.USER),
                buildUser("seed.roommate8@roomievibe.local", "Trịnh Minh Quân", "0902221118", Role.USER),
                buildUser("seed.roommate9@roomievibe.local", "Hồ Thị Diễm My", "0902221119", Role.USER));
        return userRepository.saveAll(users);
    }

    private int seedRoommateProfiles(List<User> users) {
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
                        "0902221119", "seed-roommate-9"));

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
                    .imageUrls(picsumImages(s.imageSeed(), 2, 700, 700))
                    .bio(s.bio())
                    .contactPhone(s.contactPhone())
                    .build();
            roommateProfileRepository.save(profile);
        }
        return seeds.size();
    }

    // ---------- Helpers ----------

    private User buildUser(String email, String fullName, String phone, Role role) {
        return User.builder()
                .email(email)
                .fullName(fullName)
                .phone(phone)
                .password(passwordEncoder.encode(SEED_PASSWORD))
                .role(role)
                .enabled(true)
                .build();
    }

    private Set<String> picsumImages(String seedPrefix, int count, int width, int height) {
        Set<String> urls = new LinkedHashSet<>();
        for (int i = 1; i <= count; i++) {
            urls.add("https://picsum.photos/seed/" + seedPrefix + "-" + i + "/" + width + "/" + height);
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
            String contactPhone,
            int maxOccupants,
            Set<Amenity> amenities,
            ListingStatus status,
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
}
