package com.example.project.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.project.dto.request.ForgotPasswordRequest;
import com.example.project.dto.request.GoogleLoginRequest;
import com.example.project.dto.request.LoginRequest;
import com.example.project.dto.request.RegisterRequest;
import com.example.project.dto.request.ResetPasswordRequest;
import com.example.project.dto.response.AuthResponse;
import com.example.project.service.AuthService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Dang ky, dang nhap, dang xuat")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.googleLogin(request));
    }

    // Always 204, whether or not the email has an account, so the endpoint can't be used to probe for users.
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reset-password/validate")
    public ResponseEntity<Void> validateResetToken(@RequestParam String token) {
        authService.validateResetToken(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring(7));
        }
        return ResponseEntity.ok().build();
    }
}
