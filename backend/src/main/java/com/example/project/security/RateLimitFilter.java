package com.example.project.security;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Sliding-window rate limiting for the three endpoints most exposed to abuse:
 * dang ky (spam accounts), dang nhap (password brute-force) and dang tin
 * (spam listings). Runs after {@link JwtAuthenticationFilter} so the
 * authenticated user is already resolved for the listing-creation check.
 */
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final SlidingWindowRateLimiter rateLimiter;
    // Instantiated directly (not injected) - this project's webmvc starter doesn't
    // always expose a managed ObjectMapper bean, and this filter only needs a plain one.
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.ratelimit.register.max:5}")
    private int registerMax;
    @Value("${app.ratelimit.register.window-minutes:10}")
    private int registerWindowMinutes;

    @Value("${app.ratelimit.login.max-failed:5}")
    private int loginMaxFailed;
    @Value("${app.ratelimit.login.window-minutes:15}")
    private int loginWindowMinutes;

    @Value("${app.ratelimit.listing.max:10}")
    private int listingMax;
    @Value("${app.ratelimit.listing.window-hours:24}")
    private int listingWindowHours;

    @Value("${app.ratelimit.forgot-password.max:5}")
    private int forgotPasswordMax;
    @Value("${app.ratelimit.forgot-password.window-minutes:15}")
    private int forgotPasswordWindowMinutes;

    @Value("${app.ratelimit.ai-search.max:15}")
    private int aiSearchMax;
    @Value("${app.ratelimit.ai-search.window-minutes:10}")
    private int aiSearchWindowMinutes;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();
        boolean isPost = "POST".equals(request.getMethod());

        if (isPost && "/api/auth/register".equals(path)) {
            handleRegister(request, response, filterChain);
            return;
        }
        if (isPost && "/api/auth/login".equals(path)) {
            handleLogin(request, response, filterChain);
            return;
        }
        if (isPost && "/api/listings".equals(path)) {
            handleListingCreate(request, response, filterChain);
            return;
        }
        if (isPost && "/api/auth/forgot-password".equals(path)) {
            handleForgotPassword(request, response, filterChain);
            return;
        }
        if (isPost && "/api/auth/reset-password/verify".equals(path)) {
            // Each code already allows only 5 guesses; this caps guessing across many codes from one IP.
            if (!rateLimiter.tryConsume("reset-verify:" + clientIp(request), 20, Duration.ofMinutes(15))) {
                reject(response, "Bạn đã thử quá nhiều lần, vui lòng thử lại sau 15 phút.");
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }
        if (isPost && "/api/ai/search".equals(path)) {
            handleAiSearch(request, response, filterChain);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void handleForgotPassword(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // Each call can send an email: cap it per IP so the form can't be used to flood someone's inbox.
        String key = "forgot-password:" + clientIp(request);
        if (!rateLimiter.tryConsume(key, forgotPasswordMax, Duration.ofMinutes(forgotPasswordWindowMinutes))) {
            reject(response, "Bạn đã yêu cầu quá nhiều lần, vui lòng thử lại sau " + forgotPasswordWindowMinutes + " phút.");
            return;
        }
        chain.doFilter(request, response);
    }

    private void handleAiSearch(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // Public endpoint that calls a metered/quota-limited external AI model -
        // an easy target to burn through the quota with a script, so it's limited
        // per IP the same way registration is.
        String key = "ai-search:" + clientIp(request);
        if (!rateLimiter.tryConsume(key, aiSearchMax, Duration.ofMinutes(aiSearchWindowMinutes))) {
            reject(response, "Ban da dung tro ly AI qua nhieu lan, vui long thu lai sau it phut.");
            return;
        }
        chain.doFilter(request, response);
    }

    private void handleRegister(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String key = "register:" + clientIp(request);
        if (!rateLimiter.tryConsume(key, registerMax, Duration.ofMinutes(registerWindowMinutes))) {
            reject(response, "Ban da dang ky qua nhieu lan, vui long thu lai sau it phut.");
            return;
        }
        chain.doFilter(request, response);
    }

    private void handleListingCreate(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            // Not logged in - let Spring Security reject with its usual 401/403.
            chain.doFilter(request, response);
            return;
        }
        String key = "listing:" + auth.getName();
        if (!rateLimiter.tryConsume(key, listingMax, Duration.ofHours(listingWindowHours))) {
            reject(response, "Ban da dang qua nhieu tin trong ngay, vui long thu lai vao ngay mai.");
            return;
        }
        chain.doFilter(request, response);
    }

    private void handleLogin(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String key = "login:" + clientIp(request);
        Duration window = Duration.ofMinutes(loginWindowMinutes);

        if (rateLimiter.isBlocked(key, loginMaxFailed, window)) {
            reject(response, "Qua nhieu lan dang nhap sai, vui long thu lai sau " + loginWindowMinutes + " phut.");
            return;
        }

        chain.doFilter(request, response);

        // Only count it after we see how the login actually turned out: a failed
        // attempt (bad credentials, disabled account, validation error, ...) adds
        // to the sliding window; a successful one clears it.
        if (response.getStatus() == HttpStatus.OK.value()) {
            rateLimiter.reset(key);
        } else {
            rateLimiter.recordHit(key);
        }
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void reject(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json;charset=UTF-8");
        Map<String, Object> body = Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                "message", message);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
