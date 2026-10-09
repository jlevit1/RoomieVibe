package com.example.project.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project.dto.request.ForgotPasswordRequest;
import com.example.project.dto.request.GoogleLoginRequest;
import com.example.project.dto.request.LoginRequest;
import com.example.project.dto.request.RegisterRequest;
import com.example.project.dto.request.ResetPasswordRequest;
import com.example.project.dto.response.AuthResponse;
import com.example.project.entity.PasswordResetToken;
import com.example.project.entity.Role;
import com.example.project.entity.User;
import com.example.project.exception.BadRequestException;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.repository.PasswordResetTokenRepository;
import com.example.project.repository.UserRepository;
import com.example.project.security.CustomUserDetailsService;
import com.example.project.security.GoogleTokenVerifier;
import com.example.project.security.JwtService;
import com.example.project.security.TokenBlacklistService;
import com.example.project.service.AuthService;
import com.example.project.service.MailService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final TokenBlacklistService blacklistService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final MailService mailService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String INVALID_RESET_LINK = "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.";

    @Value("${app.password-reset.valid-minutes:30}")
    private int resetValidMinutes;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email da duoc su dung: " + request.getEmail());
        }

        Role role = request.getRole() == null ? Role.USER : request.getRole();
        if (role == Role.ADMIN) {
            throw new BadRequestException("Khong the tu dang ky voi vai tro ADMIN");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(role)
                .build();

        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            // Two concurrent registrations for the same email can both pass the
            // existsByEmail check above before either commits; the DB's unique
            // constraint on email is the real guard, this turns that race into the
            // same clean error the pre-check gives instead of a raw 500.
            throw new BadRequestException("Email da duoc su dung: " + request.getEmail());
        }
        mailService.sendWelcome(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        return buildAuthResponse(user, token);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Email khong ton tai"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        return buildAuthResponse(user, token);
    }

    @Override
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = googleTokenVerifier.verify(request.getIdToken());
        String email = payload.getEmail();
        String fullName = (String) payload.get("name");

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> registerGoogleUser(email, fullName, request.getRole()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        return buildAuthResponse(user, token);
    }

    private User registerGoogleUser(String email, String fullName, Role requestedRole) {
        Role role = requestedRole == null ? Role.USER : requestedRole;
        if (role == Role.ADMIN) {
            throw new BadRequestException("Khong the tu dang ky voi vai tro ADMIN");
        }

        User user = User.builder()
                .fullName(fullName != null ? fullName : email)
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(role)
                .build();

        User saved = userRepository.save(user);
        mailService.sendWelcome(saved);
        return saved;
    }

    @Override
    public void logout(String token) {
        blacklistService.blacklist(token);
    }

    @Override
    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail().trim())
                .filter(User::getEnabled)
                .ifPresent(user -> {
                    resetTokenRepository.retireOpenTokens(user, Instant.now());
                    String rawToken = newRawToken();
                    resetTokenRepository.save(PasswordResetToken.builder()
                            .user(user)
                            .tokenHash(sha256(rawToken))
                            .expiresAt(Instant.now().plus(Duration.ofMinutes(resetValidMinutes)))
                            .build());
                    String link = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + rawToken;
                    mailService.sendPasswordReset(user, link, resetValidMinutes);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public void validateResetToken(String token) {
        findUsableToken(token);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = findUsableToken(request.getToken());
        User user = resetToken.getUser();
        if (!user.getEnabled()) {
            throw new BadRequestException(INVALID_RESET_LINK);
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        resetTokenRepository.retireOpenTokens(user, Instant.now());
        mailService.sendPasswordChanged(user);
    }

    private PasswordResetToken findUsableToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new BadRequestException(INVALID_RESET_LINK);
        }
        return resetTokenRepository.findByTokenHash(sha256(rawToken.trim()))
                .filter(PasswordResetToken::isUsable)
                .orElseThrow(() -> new BadRequestException(INVALID_RESET_LINK));
    }

    private static String newRawToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
