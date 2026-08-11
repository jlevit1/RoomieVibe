package com.example.project.dto.request;

import java.math.BigDecimal;
import java.util.Set;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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

    @NotBlank(message = "Quan/huyen khong duoc de trong")
    private String district;

    @NotBlank(message = "Dia chi khong duoc de trong")
    private String address;

    private Integer maxOccupants;

    private Set<String> amenities;

    private Set<String> imageUrls;
}
