package com.example.project.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.project.dto.request.CreateListingRequest;
import com.example.project.dto.request.RejectListingRequest;
import com.example.project.dto.response.RoomListingResponse;

public interface RoomListingService {

    RoomListingResponse create(String landlordEmail, CreateListingRequest request);

    RoomListingResponse update(String landlordEmail, Long id, CreateListingRequest request);

    void delete(String landlordEmail, Long id);

    RoomListingResponse getById(Long id);

    Page<RoomListingResponse> search(String city, String district, BigDecimal minPrice,
                                      BigDecimal maxPrice, Integer maxOccupants, Pageable pageable);

    List<RoomListingResponse> getMine(String landlordEmail);

    List<RoomListingResponse> getPending();

    RoomListingResponse approve(Long id);

    RoomListingResponse reject(Long id, RejectListingRequest request);
}
