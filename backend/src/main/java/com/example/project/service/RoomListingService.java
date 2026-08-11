package com.example.project.service;

import java.util.List;

import com.example.project.dto.request.CreateListingRequest;
import com.example.project.dto.request.RejectListingRequest;
import com.example.project.dto.response.RoomListingResponse;

public interface RoomListingService {

    RoomListingResponse create(String landlordEmail, CreateListingRequest request);

    RoomListingResponse getById(Long id);

    List<RoomListingResponse> getMine(String landlordEmail);

    List<RoomListingResponse> getPending();

    RoomListingResponse approve(Long id);

    RoomListingResponse reject(Long id, RejectListingRequest request);
}
