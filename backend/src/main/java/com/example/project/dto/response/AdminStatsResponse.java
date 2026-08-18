package com.example.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalUsers;
    private long totalLandlords;
    private long totalListings;
    private long pendingListings;
    private long approvedListings;
    private long rejectedListings;
}
