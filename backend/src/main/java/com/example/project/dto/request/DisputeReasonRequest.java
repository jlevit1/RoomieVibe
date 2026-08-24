package com.example.project.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DisputeReasonRequest {

    @NotBlank(message = "Vui long nhap ly do")
    private String reason;
}
