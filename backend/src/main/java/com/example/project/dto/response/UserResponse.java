package com.example.project.dto.response;

import java.time.Instant;

import com.example.project.entity.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private Boolean enabled;
    private Instant createdAt;
}
