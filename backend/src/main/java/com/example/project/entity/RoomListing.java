package com.example.project.entity;

import java.math.BigDecimal;
import java.time.Instant;
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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "room_listings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "landlord_id", nullable = false)
    private User landlord;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    private Double area;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String district;

    @Column(nullable = false)
    private String address;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false)
    private String contactPhone;

    private Integer maxOccupants;

    @ElementCollection(targetClass = Amenity.class)
    @CollectionTable(name = "room_listing_amenities", joinColumns = @JoinColumn(name = "listing_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "amenity")
    @Builder.Default
    private Set<Amenity> amenities = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "room_listing_images", joinColumns = @JoinColumn(name = "listing_id"))
    @Column(name = "image_url")
    @Builder.Default
    private Set<String> imageUrls = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ListingStatus status = ListingStatus.CHO_DUYET;

    private String rejectReason;

    @Column(nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.expiresAt == null) {
            this.expiresAt = this.createdAt.plus(java.time.Duration.ofDays(30));
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
