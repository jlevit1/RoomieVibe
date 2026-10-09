package com.example.project.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AiSearchResponse {
    private String reply;
    private List<RoomListingResponse> listings;
    // Set only when the request was "near <place>" and the place was found on the map.
    private LandmarkResponse landmark;
}
