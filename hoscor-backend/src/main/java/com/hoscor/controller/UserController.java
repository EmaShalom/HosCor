package com.hoscor.controller;

import com.hoscor.domain.entity.AppUser;
import com.hoscor.domain.repository.AppUserRepository;
import com.hoscor.dto.ApiResponse;
import com.hoscor.dto.UpdateRoleRequest;
import com.hoscor.dto.UserDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final AppUserRepository userRepo;

    @GetMapping
    public ApiResponse<List<UserDto>> listUsers() {
        List<UserDto> users = userRepo.findAll().stream()
                .map(UserDto::from)
                .toList();
        return ApiResponse.ok(users);
    }

    @PatchMapping("/{id}/role")
    public ApiResponse<UserDto> updateRole(@PathVariable Long id, @Valid @RequestBody UpdateRoleRequest req) {
        AppUser user = userRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String role = req.getRole().startsWith("ROLE_") ? req.getRole() : "ROLE_" + req.getRole();
        validateRole(role);
        user.setRole(role);
        // Unit is required for COMMIS_ETAGE and CHEF_UNITE; cleared for other roles
        if ("ROLE_COMMIS_ETAGE".equals(role) || "ROLE_CHEF_UNITE".equals(role)) {
            user.setUnit(req.getUnit());
        } else {
            user.setUnit(null);
        }
        userRepo.save(user);
        return ApiResponse.ok(UserDto.from(user));
    }

    private void validateRole(String role) {
        java.util.Set<String> allowed = java.util.Set.of(
            "ROLE_ADMIN", "ROLE_COORDONNATEUR", "ROLE_GESTIONNAIRE_LIT",
            "ROLE_URGENCE", "ROLE_HYGIENE", "ROLE_COMMIS_ETAGE", "ROLE_CHEF_UNITE"
        );
        if (!allowed.contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rôle invalide: " + role);
        }
    }

    @PatchMapping("/{id}/toggle-active")
    public ApiResponse<Map<String, Object>> toggleActive(@PathVariable Long id) {
        AppUser user = userRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setActive(!user.isActive());
        userRepo.save(user);
        return ApiResponse.ok(Map.of("active", user.isActive(), "username", user.getUsername()));
    }
}
