package com.example.project.dto.request;

import com.example.project.entity.BoostPackage;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BoostListingRequest {

    @NotNull(message = "Vui long chon goi day tin")
    private BoostPackage packageCode;
}
