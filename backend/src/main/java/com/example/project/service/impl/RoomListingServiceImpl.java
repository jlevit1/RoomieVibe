package com.example.project.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project.dto.request.CreateListingRequest;
import com.example.project.dto.request.RejectListingRequest;
import com.example.project.dto.response.BoostPackageResponse;
import com.example.project.dto.response.ListingMapPoint;
import com.example.project.dto.response.RoomListingResponse;
import com.example.project.dto.response.TenantCandidateResponse;
import com.example.project.entity.Amenity;
import com.example.project.entity.BoostPackage;
import com.example.project.entity.Conversation;
import com.example.project.entity.FavoriteListing;
import com.example.project.entity.ListingRental;
import com.example.project.entity.ListingStatus;
import com.example.project.entity.NotificationType;
import com.example.project.entity.RoomListing;
import com.example.project.entity.User;
import com.example.project.entity.WalletTransactionType;
import com.example.project.exception.BadRequestException;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.exception.UnauthorizedException;
import com.example.project.repository.ConversationRepository;
import com.example.project.repository.FavoriteListingRepository;
import com.example.project.repository.ListingRentalRepository;
import com.example.project.repository.RoomListingRepository;
import com.example.project.repository.UserRepository;
import com.example.project.service.NotificationService;
import com.example.project.service.RoomListingService;
import com.example.project.service.WalletService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomListingServiceImpl implements RoomListingService {

    private static final String LISTING_NOT_FOUND = "Khong tim thay tin dang";
    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double KM_PER_DEGREE_LAT = 111.32;

    private final RoomListingRepository roomListingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final FavoriteListingRepository favoriteListingRepository;
    private final ConversationRepository conversationRepository;
    private final ListingRentalRepository listingRentalRepository;
    private final WalletService walletService;

    @Override
    public RoomListingResponse create(String landlordEmail, CreateListingRequest request) {
        User landlord = userRepository.findByEmail(landlordEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay chu nha"));

        RoomListing listing = RoomListing.builder()
                .landlord(landlord)
                .status(ListingStatus.CHO_DUYET)
                .build();

        applyRequest(listing, request);

        roomListingRepository.save(listing);
        return toResponse(listing);
    }

    @Override
    public RoomListingResponse update(String landlordEmail, Long id, CreateListingRequest request) {
        RoomListing listing = roomListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(LISTING_NOT_FOUND));

        if (!listing.getLandlord().getEmail().equals(landlordEmail)) {
            throw new UnauthorizedException("Ban khong co quyen sua tin dang nay");
        }

        applyRequest(listing, request);
        listing.setStatus(ListingStatus.CHO_DUYET);
        listing.setRejectReason(null);

        roomListingRepository.save(listing);
        return toResponse(listing);
    }

    private void applyRequest(RoomListing listing, CreateListingRequest request) {
        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.getPrice());
        listing.setArea(request.getArea());
        listing.setCity(request.getCity());
        listing.setDistrict(request.getDistrict());
        listing.setWard(request.getWard());
        listing.setAddress(request.getAddress());
        listing.setLatitude(request.getLatitude());
        listing.setLongitude(request.getLongitude());
        listing.setContactPhone(request.getContactPhone());
        listing.setMaxOccupants(request.getMaxOccupants());
        if (request.getAmenities() != null) {
            listing.setAmenities(request.getAmenities());
        }
        if (request.getImageUrls() != null) {
            listing.setImageUrls(request.getImageUrls());
        }
    }

    @Override
    public void delete(String landlordEmail, Long id) {
        RoomListing listing = roomListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(LISTING_NOT_FOUND));

        if (!listing.getLandlord().getEmail().equals(landlordEmail)) {
            throw new UnauthorizedException("Ban khong co quyen xoa tin dang nay");
        }

        roomListingRepository.delete(listing);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomListingResponse getById(Long id) {
        RoomListing listing = roomListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(LISTING_NOT_FOUND));

        // Rented listings stay viewable (favorites, old chat links, tenant reviews); only search hides them.
        if (listing.getStatus() != ListingStatus.HIEN_THI && listing.getStatus() != ListingStatus.DA_CHO_THUE) {
            throw new ResourceNotFoundException(LISTING_NOT_FOUND);
        }

        return toResponse(listing);
    }

    // Counted separately from getById so re-fetching a listing (refresh, React dev double effects) doesn't inflate views.
    @Override
    @Transactional
    public void recordView(Long id) {
        roomListingRepository.incrementViewCount(id, List.of(ListingStatus.HIEN_THI, ListingStatus.DA_CHO_THUE));
    }

    @Override
    public Page<RoomListingResponse> search(String city, String district, String ward, BigDecimal minPrice,
                                             BigDecimal maxPrice, Double minArea, Double maxArea,
                                             Integer maxOccupants, List<Amenity> amenities, Pageable pageable) {
        long amenityCount = amenities == null ? 0 : amenities.size();
        List<Amenity> safeAmenities = amenityCount == 0 ? List.of(Amenity.values()[0]) : amenities;
        // Boosted listings jump the queue only under the default newest-first order, never over an explicit price sort.
        boolean promoteFirst = pageable.getSort().getOrderFor("createdAt") != null;
        // Districts are stored as "Cầu Giấy" and "Quận Cầu Giấy"; the leading space keeps "Quận 1" off "Quận 11".
        String districtBare = district == null ? null : ADMIN_PREFIX.matcher(district.trim()).replaceFirst("");
        String districtSuffix = districtBare == null ? null : "% " + districtBare;
        return roomListingRepository
                .search(ListingStatus.HIEN_THI, city, district, districtBare, districtSuffix, ward, minPrice,
                        maxPrice, minArea, maxArea, maxOccupants, safeAmenities, amenityCount, promoteFirst,
                        Instant.now(), pageable)
                .map(this::toResponse);
    }

    private static final Pattern ADMIN_PREFIX =
            Pattern.compile("^(Quận|Huyện|Thị xã|Thành phố|Thị trấn)\\s+", Pattern.CASE_INSENSITIVE);

    @Override
    public List<RoomListingResponse> searchNearby(double latitude, double longitude, double radiusKm,
                                                   BigDecimal minPrice, BigDecimal maxPrice,
                                                   List<Amenity> amenities, int limit) {
        long amenityCount = amenities == null ? 0 : amenities.size();
        List<Amenity> safeAmenities = amenityCount == 0 ? List.of(Amenity.values()[0]) : amenities;

        // Cheap bounding-box prefilter in SQL, exact great-circle distance in Java.
        double latDelta = radiusKm / KM_PER_DEGREE_LAT;
        double lngDelta = radiusKm / (KM_PER_DEGREE_LAT * Math.cos(Math.toRadians(latitude)));

        return roomListingRepository
                .findInBoundingBox(ListingStatus.HIEN_THI,
                        latitude - latDelta, latitude + latDelta, longitude - lngDelta, longitude + lngDelta,
                        minPrice, maxPrice, safeAmenities, amenityCount)
                .stream()
                .map(l -> Map.entry(l, haversineKm(latitude, longitude, l.getLatitude(), l.getLongitude())))
                .filter(entry -> entry.getValue() <= radiusKm)
                .sorted(Map.Entry.comparingByValue())
                .limit(limit)
                .map(entry -> toResponse(entry.getKey(), Math.round(entry.getValue() * 100) / 100.0))
                .toList();
    }

    private static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    @Override
    public List<RoomListingResponse> getMine(String landlordEmail) {
        User landlord = userRepository.findByEmail(landlordEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay chu nha"));

        return roomListingRepository.findByLandlordOrderByCreatedAtDesc(landlord).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<RoomListingResponse> getPending() {
        return roomListingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.CHO_DUYET).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public RoomListingResponse approve(Long id) {
        RoomListing listing = roomListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(LISTING_NOT_FOUND));

        listing.setStatus(ListingStatus.HIEN_THI);
        listing.setRejectReason(null);
        roomListingRepository.save(listing);
        notificationService.notify(listing.getLandlord(), NotificationType.LISTING_APPROVED,
                "Tin dang \"" + listing.getTitle() + "\" da duoc duyet", "/listings/mine");
        return toResponse(listing);
    }

    @Override
    public RoomListingResponse reject(Long id, RejectListingRequest request) {
        RoomListing listing = roomListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(LISTING_NOT_FOUND));

        listing.setStatus(ListingStatus.TU_CHOI);
        listing.setRejectReason(request.getReason());
        roomListingRepository.save(listing);
        notificationService.notify(listing.getLandlord(), NotificationType.LISTING_REJECTED,
                "Tin dang \"" + listing.getTitle() + "\" bi tu choi: " + request.getReason(), "/listings/mine");
        return toResponse(listing);
    }

    @Override
    public List<ListingMapPoint> getMapPoints() {
        return roomListingRepository
                .findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(ListingStatus.HIEN_THI).stream()
                .map(listing -> ListingMapPoint.builder()
                        .id(listing.getId())
                        .title(listing.getTitle())
                        .thumbnailUrl(listing.getImageUrls().stream().findFirst().orElse(null))
                        .district(listing.getDistrict())
                        .city(listing.getCity())
                        .latitude(listing.getLatitude())
                        .longitude(listing.getLongitude())
                        .price(listing.getPrice())
                        .build())
                .toList();
    }

    private static final int RECOMMENDATION_LIMIT = 8;

    @Override
    public List<RoomListingResponse> getRecommended(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return List.of();
        }

        List<RoomListing> favorited = favoriteListingRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(FavoriteListing::getListing)
                .toList();
        if (favorited.isEmpty()) {
            return List.of();
        }

        Set<Long> favoritedIds = favorited.stream().map(RoomListing::getId).collect(Collectors.toSet());

        String topCity = favorited.stream()
                .collect(Collectors.groupingBy(RoomListing::getCity, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        Set<String> favDistricts = favorited.stream().map(RoomListing::getDistrict).collect(Collectors.toSet());

        BigDecimal avgPrice = favorited.stream()
                .map(RoomListing::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(favorited.size()), 4, RoundingMode.HALF_UP);

        Set<Amenity> favAmenities = favorited.stream()
                .flatMap(l -> l.getAmenities().stream())
                .collect(Collectors.toSet());

        return roomListingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.HIEN_THI).stream()
                .filter(l -> !favoritedIds.contains(l.getId()))
                .filter(l -> !l.getLandlord().getId().equals(user.getId()))
                .map(l -> Map.entry(l, scoreCandidate(l, topCity, favDistricts, avgPrice, favAmenities)))
                .filter(entry -> entry.getValue() > 0)
                .sorted(Comparator.<Map.Entry<RoomListing, Integer>>comparingInt(Map.Entry::getValue).reversed()
                        .thenComparing(entry -> entry.getKey().getCreatedAt(), Comparator.reverseOrder()))
                .limit(RECOMMENDATION_LIMIT)
                .map(entry -> toResponse(entry.getKey()))
                .toList();
    }

    // Content-based filtering: score each candidate against the profile derived from
    // the user's favorited listings (district match, price proximity, amenity overlap).
    // No ML model - a transparent, explainable weighted feature score.
    //
    // Same city is a HARD requirement, not just a scoring bonus - a room in a
    // different province is never a real substitute no matter how many amenities
    // it happens to share (almost every listing has Wifi, so amenity overlap alone
    // is too weak a signal to cross city lines). Within the same city, a candidate
    // still needs at least one concrete match (same district, close price, or 2+
    // shared amenities) to qualify - "same city" alone is still too broad on its own
    // for a metro the size of TP.HCM or Ha Noi.
    private int scoreCandidate(RoomListing candidate, String topCity, Set<String> favDistricts,
                                BigDecimal avgPrice, Set<Amenity> favAmenities) {
        boolean cityMatch = topCity != null && topCity.equals(candidate.getCity());
        if (!cityMatch) {
            return 0;
        }

        boolean districtMatch = favDistricts.contains(candidate.getDistrict());

        int priceScore = 0;
        if (avgPrice.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal relativeDiff = candidate.getPrice().subtract(avgPrice).abs()
                    .divide(avgPrice, 4, RoundingMode.HALF_UP);
            if (relativeDiff.compareTo(new BigDecimal("0.2")) <= 0) {
                priceScore = 2;
            } else if (relativeDiff.compareTo(new BigDecimal("0.5")) <= 0) {
                priceScore = 1;
            }
        }
        long amenityOverlap = candidate.getAmenities().stream().filter(favAmenities::contains).count();

        // Amenity overlap is dropped as an independent qualifier - almost every listing has
        // Wifi/May lanh, so it was letting candidates priced far outside what the user has
        // shown they'll pay sneak in on "2 shared amenities" alone. It still boosts the score
        // below once price or district has already qualified the candidate.
        boolean hasMeaningfulSignal = districtMatch || priceScore > 0;
        if (!hasMeaningfulSignal) {
            return 0;
        }

        int score = priceScore + (int) Math.min(amenityOverlap, 3);
        if (districtMatch) {
            score += 3;
        }
        return score;
    }

    @Override
    @Transactional
    public RoomListingResponse markRented(String landlordEmail, Long id, Long tenantId) {
        RoomListing listing = findOwnedListing(landlordEmail, roomListingRepository.findById(id));
        if (listing.getStatus() != ListingStatus.HIEN_THI) {
            throw new BadRequestException("Chi danh dau da cho thue duoc voi tin dang dang hien thi");
        }

        if (tenantId != null) {
            // Only someone who contacted the landlord about this listing can be its tenant (it grants review rights).
            User tenant = conversationRepository.findByListingOrderByCreatedAtDesc(listing).stream()
                    .map(Conversation::getRenter)
                    .filter(renter -> renter.getId().equals(tenantId))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException(
                            "Nguoi thue phai la nguoi da nhan tin ve tin dang nay"));

            if (!listingRentalRepository.existsByListingAndTenant(listing, tenant)) {
                listingRentalRepository.save(ListingRental.builder().listing(listing).tenant(tenant).build());
            }
            notificationService.notify(tenant, NotificationType.RENTAL_CONFIRMED,
                    "Chủ nhà đã xác nhận bạn thuê \"" + listing.getTitle() + "\". Hãy để lại đánh giá nhé!",
                    "/listings/" + listing.getId());
        }

        listing.setStatus(ListingStatus.DA_CHO_THUE);
        roomListingRepository.save(listing);
        return toResponse(listing);
    }

    @Override
    public RoomListingResponse markAvailable(String landlordEmail, Long id) {
        RoomListing listing = findOwnedListing(landlordEmail, roomListingRepository.findById(id));
        if (listing.getStatus() != ListingStatus.DA_CHO_THUE) {
            throw new BadRequestException("Tin dang khong o trang thai da cho thue");
        }
        // Back straight to visible: the content was already approved and hasn't changed.
        listing.setStatus(ListingStatus.HIEN_THI);
        roomListingRepository.save(listing);
        return toResponse(listing);
    }

    @Override
    public List<TenantCandidateResponse> getTenantCandidates(String landlordEmail, Long id) {
        RoomListing listing = findOwnedListing(landlordEmail, roomListingRepository.findById(id));
        return conversationRepository.findByListingOrderByCreatedAtDesc(listing).stream()
                .map(Conversation::getRenter)
                .map(renter -> TenantCandidateResponse.builder()
                        .userId(renter.getId())
                        .fullName(renter.getFullName())
                        .build())
                .toList();
    }

    @Override
    public List<BoostPackageResponse> getBoostPackages() {
        return Arrays.stream(BoostPackage.values())
                .map(p -> BoostPackageResponse.builder().code(p).days(p.getDays()).price(p.getPrice()).build())
                .toList();
    }

    @Override
    @Transactional
    public RoomListingResponse boost(String landlordEmail, Long id, BoostPackage boostPackage) {
        RoomListing listing = findOwnedListing(landlordEmail, roomListingRepository.findByIdForUpdate(id));
        if (listing.getStatus() != ListingStatus.HIEN_THI) {
            throw new BadRequestException("Chi day duoc tin dang dang hien thi");
        }

        walletService.debit(listing.getLandlord(), boostPackage.getPrice(), WalletTransactionType.DAY_TIN);

        // Buying again while still promoted extends from the current end date, so no paid day is lost.
        Instant now = Instant.now();
        Instant base = listing.getPromotedUntil() != null && listing.getPromotedUntil().isAfter(now)
                ? listing.getPromotedUntil()
                : now;
        listing.setPromotedUntil(base.plus(Duration.ofDays(boostPackage.getDays())));
        roomListingRepository.save(listing);
        return toResponse(listing);
    }

    // 400 rather than UnauthorizedException: the frontend treats any 401 as an expired session and logs out.
    private RoomListing findOwnedListing(String landlordEmail, Optional<RoomListing> found) {
        RoomListing listing = found.orElseThrow(() -> new ResourceNotFoundException(LISTING_NOT_FOUND));
        if (!listing.getLandlord().getEmail().equals(landlordEmail)) {
            throw new BadRequestException("Ban khong co quyen thao tac tren tin dang nay");
        }
        return listing;
    }

    private RoomListingResponse toResponse(RoomListing listing) {
        return toResponse(listing, null);
    }

    private RoomListingResponse toResponse(RoomListing listing, Double distanceKm) {
        Instant promotedUntil = listing.getPromotedUntil();
        return RoomListingResponse.builder()
                .id(listing.getId())
                .landlordId(listing.getLandlord().getId())
                .landlordName(listing.getLandlord().getFullName())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .price(listing.getPrice())
                .area(listing.getArea())
                .city(listing.getCity())
                .district(listing.getDistrict())
                .ward(listing.getWard())
                .address(listing.getAddress())
                .latitude(listing.getLatitude())
                .longitude(listing.getLongitude())
                .contactPhone(listing.getContactPhone())
                .maxOccupants(listing.getMaxOccupants())
                .amenities(listing.getAmenities())
                .imageUrls(listing.getImageUrls())
                .status(listing.getStatus())
                .rejectReason(listing.getRejectReason())
                .viewCount(listing.getViewCount())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .expiresAt(listing.getExpiresAt())
                .promotedUntil(promotedUntil)
                .promoted(promotedUntil != null && promotedUntil.isAfter(Instant.now()))
                .averageRating(listing.getAverageRating() == null
                        ? null
                        : Math.round(listing.getAverageRating() * 10) / 10.0)
                .reviewCount(listing.getReviewCount() == null ? 0 : listing.getReviewCount())
                .distanceKm(distanceKm)
                .build();
    }
}
