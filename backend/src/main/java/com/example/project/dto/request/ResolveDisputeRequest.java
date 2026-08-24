package com.example.project.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResolveDisputeRequest {

    @NotNull(message = "Vui long chon phuong an xu ly")
    private Boolean releaseToLandlord;

    private String note;
}
