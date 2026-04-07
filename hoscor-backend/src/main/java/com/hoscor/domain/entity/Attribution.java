package com.hoscor.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "attributions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bed_id", nullable = false)
    private Bed bed;

    @Column(name = "stretcher_number", nullable = false, length = 20)
    private String stretcherNumber;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;
}
