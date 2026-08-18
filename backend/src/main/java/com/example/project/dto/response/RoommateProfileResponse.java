package com.example.project.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

import com.example.project.entity.CleanlinessLevel;
import com.example.project.entity.Gender;
import com.example.project.entity.Occupation;
import com.example.project.entity.RoommateStatus;
import com.example.project.entity.SleepSchedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class RoommateProfileResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private RoommateStatus status;
    private String city;
    private Set<String> districts;
    private BigDecimal budget;
    private LocalDate moveInDate;
    private Gender gender;
    private Gender preferredGender;
    private Occupation occupation;
    private Occupation preferredOccupation;
    private SleepSchedule sleepSchedule;
    private CleanlinessLevel cleanliness;
    private Boolean smokes;
    private Boolean acceptsSmoking;
    private Boolean hasPet;
    private Boolean acceptsPets;
    private Boolean cooksAtHome;
    private Set<String> imageUrls;
    private String bio;
    private String contactPhone;
    private Instant createdAt;
    private Instant updatedAt;

    /** Chi co gia tri khi tra ve trong danh sach goi y, null khi la ho so cua chinh minh. */
    private Integer compatibilityScore;

    /** True neu day la ho so cua chinh nguoi dang goi API. */
    private boolean own;
}
