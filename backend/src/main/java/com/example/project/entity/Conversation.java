package com.example.project.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "conversations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"listing_id", "renter_id"}),
        @UniqueConstraint(columnNames = {"roommate_profile_id", "renter_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    private RoomListing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roommate_profile_id")
    private RoommateProfile roommateProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "renter_id", nullable = false)
    private User renter;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant renterLastReadAt;

    private Instant landlordLastReadAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
