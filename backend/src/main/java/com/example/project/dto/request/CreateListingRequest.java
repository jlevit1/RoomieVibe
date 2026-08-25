package com.example.project.dto.request;

import java.math.BigDecimal;
import java.util.Set;

import com.example.project.entity.Amenity;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateListingRequest {

    @NotBlank(message = "Tieu de khong duoc de trong")
    private String title;

    private String description;

    @NotNull(message = "Gia khong duoc de trong")
    @DecimalMin(value = "0.0", inclusive = false, message = "Gia phai lon hon 0")
    private BigDecimal price;

    @Positive(message = "Dien tich phai lon hon 0")
    private Double area;

    @NotBlank(message = "Tinh/thanh pho khong duoc de trong")
    private String city;

    @NotBlank(message = "Quan/huyen khong duoc de trong")
    private String district;

    private String ward;

    @NotBlank(message = "Dia chi khong duoc de trong")
    private String address;

    private Double latitude;

    private Double longitude;

    @NotBlank(message = "So dien thoai lien he khong duoc de trong")
    private String contactPhone;

    private Integer maxOccupants;

    private Set<Amenity> amenities;

    @Size(max = 6, message = "Toi da 6 anh")
    private Set<String> imageUrls;
}
