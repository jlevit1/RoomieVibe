package com.example.project.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RejectListingRequest {

    @NotBlank(message = "Ly do tu choi khong duoc de trong")
    private String reason;
}
