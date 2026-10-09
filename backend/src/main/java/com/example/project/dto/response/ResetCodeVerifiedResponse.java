package com.example.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Short-lived token proving the emailed code was right; sent back with the new password. */
@Getter
@AllArgsConstructor
public class ResetCodeVerifiedResponse {

    private String resetToken;
}
