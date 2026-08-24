package com.example.project.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import com.example.project.entity.CleanlinessLevel;
import com.example.project.entity.Gender;
import com.example.project.entity.Occupation;
import com.example.project.entity.RoommateStatus;
import com.example.project.entity.SleepSchedule;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoommateProfileRequest {

    @NotNull(message = "Tinh trang khong duoc de trong")
    private RoommateStatus status;

    @NotBlank(message = "Tinh/thanh pho khong duoc de trong")
    private String city;

    private Set<String> districts;

    @NotNull(message = "Ngan sach khong duoc de trong")
    private BigDecimal budget;

    private LocalDate moveInDate;

    @NotNull(message = "Gioi tinh khong duoc de trong")
    private Gender gender;

    private Gender preferredGender;

    @NotNull(message = "Nghe nghiep khong duoc de trong")
    private Occupation occupation;

    private Occupation preferredOccupation;

    @NotNull(message = "Gio giac sinh hoat khong duoc de trong")
    private SleepSchedule sleepSchedule;

    @NotNull(message = "Muc do gon gang khong duoc de trong")
    private CleanlinessLevel cleanliness;

    private Boolean smokes;

    private Boolean acceptsSmoking;

    private Boolean hasPet;

    private Boolean acceptsPets;

    private Boolean cooksAtHome;

    @Size(max = 6, message = "Toi da 6 anh")
    private Set<String> imageUrls;

    private String bio;

    @NotBlank(message = "So dien thoai lien he khong duoc de trong")
    private String contactPhone;
}
