package com.example.project.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewRequest {

    @NotNull(message = "So sao khong duoc de trong")
    @Min(value = 1, message = "So sao toi thieu la 1")
    @Max(value = 5, message = "So sao toi da la 5")
    private Integer rating;

    private String comment;
}
