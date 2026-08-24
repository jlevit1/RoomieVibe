package com.example.project.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.project.dto.request.TopUpRequest;
import com.example.project.dto.response.PaymentUrlResponse;
import com.example.project.dto.response.WalletResponse;
import com.example.project.service.WalletService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
@Tag(name = "Wallet", description = "Vi, nap tien qua VNPay")
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public ResponseEntity<WalletResponse> getWallet(Authentication authentication) {
        return ResponseEntity.ok(walletService.getWallet(authentication.getName()));
    }

    @PostMapping("/topup")
    public ResponseEntity<PaymentUrlResponse> topUp(
            Authentication authentication, @Valid @RequestBody TopUpRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(
                walletService.createTopUp(authentication.getName(), request.getAmount(), httpRequest.getRemoteAddr()));
    }

    @GetMapping("/topup/ipn")
    public ResponseEntity<Map<String, String>> ipn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(walletService.handleIpn(params));
    }
}
