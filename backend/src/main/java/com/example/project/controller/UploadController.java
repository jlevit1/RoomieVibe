package com.example.project.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.project.dto.response.UploadResponse;
import com.example.project.exception.BadRequestException;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
@Tag(name = "Upload", description = "Upload anh len Cloudinary")
public class UploadController {

    private final Cloudinary cloudinary;

    @PostMapping("/image")
    public ResponseEntity<UploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File khong duoc de trong");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Chi cho phep upload file anh");
        }

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(), ObjectUtils.asMap("folder", "roomievibe"));
            return ResponseEntity.ok(new UploadResponse((String) result.get("secure_url")));
        } catch (IOException e) {
            throw new BadRequestException("Upload anh that bai: " + e.getMessage());
        }
    }
}
