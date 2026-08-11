package com.example.project.service;

import java.util.List;

import com.example.project.dto.request.CreateListingRequest;
import com.example.project.dto.request.RejectListingRequest;
import com.example.project.dto.response.RoomListingResponse;

public interface RoomListingService {

    RoomListingResponse create(String landlordEmail, CreateListingRequest request);

    RoomListingResponse update(String landlordEmail, Long id, CreateListingRequest request);

    void delete(String landlordEmail, Long id);

    RoomListingResponse getById(Long id);

    List<RoomListingResponse> getMine(String landlordEmail);

    List<RoomListingResponse> getPending();

    RoomListingResponse approve(Long id);

    RoomListingResponse reject(Long id, RejectListingRequest request);
}
