package com.example.project.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project.dto.request.AiSearchRequest;
import com.example.project.dto.response.AiSearchResponse;
import com.example.project.service.AiSearchService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Search", description = "Tro ly AI tim phong tro bang ngon ngu tu nhien (Gemini)")
public class AiSearchController {

    private final AiSearchService aiSearchService;

    @PostMapping("/search")
    public ResponseEntity<AiSearchResponse> search(@Valid @RequestBody AiSearchRequest request) {
        return ResponseEntity.ok(aiSearchService.search(request.getMessage()));
    }
}
