package com.example.project.service;

import com.example.project.dto.request.ForgotPasswordRequest;
import com.example.project.dto.request.GoogleLoginRequest;
import com.example.project.dto.request.LoginRequest;
import com.example.project.dto.request.RegisterRequest;
import com.example.project.dto.request.ResetPasswordRequest;
import com.example.project.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse googleLogin(GoogleLoginRequest request);

    void logout(String token);

    /** Emails a reset link if the address belongs to an active account; silent otherwise (no account probing). */
    void requestPasswordReset(ForgotPasswordRequest request);

    /** Throws BadRequestException when the link is unknown, used or expired. */
    void validateResetToken(String token);

    void resetPassword(ResetPasswordRequest request);
}
