package com.example.project.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "roommate_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoommateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoommateStatus status;

    @Column(nullable = false)
    private String city;

    @ElementCollection
    @CollectionTable(name = "roommate_profile_districts", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "district")
    @Builder.Default
    private Set<String> districts = new HashSet<>();

    @Column(nullable = false)
    private BigDecimal budget;

    private LocalDate moveInDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    private Gender preferredGender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Occupation occupation;

    @Enumerated(EnumType.STRING)
    private Occupation preferredOccupation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SleepSchedule sleepSchedule;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CleanlinessLevel cleanliness;

    @Column(nullable = false)
    @Builder.Default
    private Boolean smokes = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean acceptsSmoking = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean hasPet = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean acceptsPets = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean cooksAtHome = false;

    @ElementCollection
    @CollectionTable(name = "roommate_profile_images", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "image_url")
    @Builder.Default
    private Set<String> imageUrls = new HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false)
    private String contactPhone;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
