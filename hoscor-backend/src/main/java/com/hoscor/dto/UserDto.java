package com.hoscor.dto;

import com.hoscor.domain.entity.AppUser;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserDto {

    private Long id;
    private String username;
    private String email;
    private String role;
    private String unit;
    private boolean active;
    private LocalDateTime createdAt;

    public static UserDto from(AppUser u) {
        return UserDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .unit(u.getUnit())
                .active(u.isActive())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
