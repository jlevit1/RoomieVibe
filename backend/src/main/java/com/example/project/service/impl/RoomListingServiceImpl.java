package com.example.project.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project.dto.request.CreateListingRequest;
import com.example.project.dto.request.RejectListingRequest;
import com.example.project.dto.response.RoomListingResponse;
import com.example.project.entity.ListingStatus;
import com.example.project.entity.RoomListing;
import com.example.project.entity.User;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.exception.UnauthorizedException;
import com.example.project.repository.RoomListingRepository;
import com.example.project.repository.UserRepository;
import com.example.project.service.RoomListingService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomListingServiceImpl implements RoomListingService {

    private static final String LISTING_NOT_FOUND = "Khong tim thay tin dang";

    private final RoomListingRepository roomListingRepository;
    private final UserRepository userRepository;

    @Override
    public RoomListingResponse create(String landlordEmail, CreateListingRequest request) {
        User landlord = userRepository.findByEmail(landlordEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay chu nha"));

        RoomListing listing = RoomListing.builder()
                .landlord(landlord)
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .area(request.getArea())
                .district(request.getDistrict())
                .address(request.getAddress())
                .maxOccupants(request.getMaxOccupants())
                .status(ListingStatus.CHO_DUYET)
                .build();

        if (request.getAmenities() != null) {
            listing.setAmenities(request.getAmenities());
        }
        if (request.getImageUrls() != null) {
            listing.setImageUrls(request.getImageUrls());
        }

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

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.getPrice());
        listing.setArea(request.getArea());
        listing.setDistrict(request.getDistrict());
        listing.setAddress(request.getAddress());
        listing.setMaxOccupants(request.getMaxOccupants());
        if (request.getAmenities() != null) {
            listing.setAmenities(request.getAmenities());
        }
        if (request.getImageUrls() != null) {
            listing.setImageUrls(request.getImageUrls());
        }

        listing.setStatus(ListingStatus.CHO_DUYET);
        listing.setRejectReason(null);

        roomListingRepository.save(listing);
        return toResponse(listing);
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
    @Transactional
    public RoomListingResponse getById(Long id) {
        RoomListing listing = roomListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(LISTING_NOT_FOUND));

        if (listing.getStatus() != ListingStatus.HIEN_THI) {
            throw new ResourceNotFoundException(LISTING_NOT_FOUND);
        }

        listing.setViewCount(listing.getViewCount() + 1);
        return toResponse(listing);
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
        return toResponse(listing);
    }

    @Override
    public RoomListingResponse reject(Long id, RejectListingRequest request) {
        RoomListing listing = roomListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(LISTING_NOT_FOUND));

        listing.setStatus(ListingStatus.TU_CHOI);
        listing.setRejectReason(request.getReason());
        roomListingRepository.save(listing);
        return toResponse(listing);
    }

    private RoomListingResponse toResponse(RoomListing listing) {
        return RoomListingResponse.builder()
                .id(listing.getId())
                .landlordId(listing.getLandlord().getId())
                .landlordName(listing.getLandlord().getFullName())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .price(listing.getPrice())
                .area(listing.getArea())
                .district(listing.getDistrict())
                .address(listing.getAddress())
                .maxOccupants(listing.getMaxOccupants())
                .amenities(listing.getAmenities())
                .imageUrls(listing.getImageUrls())
                .status(listing.getStatus())
                .rejectReason(listing.getRejectReason())
                .viewCount(listing.getViewCount())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }
}
