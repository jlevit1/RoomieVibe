package com.example.project.service;

import com.example.project.dto.request.ForgotPasswordRequest;
import com.example.project.dto.request.GoogleLoginRequest;
import com.example.project.dto.request.LoginRequest;
import com.example.project.dto.request.RegisterRequest;
import com.example.project.dto.request.ResetPasswordRequest;
import com.example.project.dto.request.VerifyResetCodeRequest;
import com.example.project.dto.response.AuthResponse;
import com.example.project.dto.response.ResetCodeVerifiedResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse googleLogin(GoogleLoginRequest request);

    void logout(String token);

    /** Emails a 6-digit code if the address belongs to an active account; silent otherwise (no account probing). */
    void requestPasswordReset(ForgotPasswordRequest request);

    /** Checks the emailed code; a wrong guess counts towards the attempt limit. */
    ResetCodeVerifiedResponse verifyResetCode(VerifyResetCodeRequest request);

    void resetPassword(ResetPasswordRequest request);
}
