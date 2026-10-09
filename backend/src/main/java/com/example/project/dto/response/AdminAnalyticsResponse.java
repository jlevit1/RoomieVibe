package com.example.project.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AdminAnalyticsResponse {
    private List<AdminChartPoint> userSignups;
    private List<AdminChartPoint> listingSignups;
    private List<AdminChartPoint> walletTopUps;
}
