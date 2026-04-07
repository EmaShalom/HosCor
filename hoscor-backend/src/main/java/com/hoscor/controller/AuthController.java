package com.hoscor.controller;

import com.hoscor.config.JwtUtil;
import com.hoscor.domain.entity.AppUser;
import com.hoscor.domain.repository.AppUserRepository;
import com.hoscor.dto.*;
import com.hoscor.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        AppUser user = appUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not activated. Check your validation token.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        LoginResponse response = LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole())
                .unit(user.getUnit())
                .build();
        return ApiResponse.ok(response);
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        String validationToken = authService.register(request);
        return ApiResponse.ok(Map.of(
                "message", "Account created. Please validate with your token.",
                "validationToken", validationToken
        ));
    }

    @PostMapping("/validate")
    public ApiResponse<Map<String, String>> validate(@Valid @RequestBody ValidateTokenRequest request) {
        authService.validateAccount(request.getToken());
        return ApiResponse.ok(Map.of("message", "Account activated successfully. You can now log in."));
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String resetToken = authService.forgotPassword(request.getUsernameOrEmail());
        return ApiResponse.ok(Map.of(
                "message", "Reset token generated. Use it to reset your password.",
                "resetToken", resetToken
        ));
    }

    @PostMapping("/reset-password")
    public ApiResponse<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok(Map.of("message", "Password reset successfully. You can now log in."));
    }
}
