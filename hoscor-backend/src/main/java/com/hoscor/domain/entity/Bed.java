package com.hoscor.domain.entity;

import com.hoscor.domain.enums.BedState;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "beds")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String unit;

    @Column(name = "bed_number", nullable = false, length = 10)
    private String bedNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BedState state = BedState.AVAILABLE;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "reserved_until")
    private LocalDateTime reservedUntil;

    @Column(name = "reserved_by_user_id")
    private Long reservedByUserId;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
    }
}
