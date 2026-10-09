package com.example.project.service;

import com.example.project.dto.response.AiSearchResponse;

public interface AiSearchService {

    AiSearchResponse search(String message);
}
