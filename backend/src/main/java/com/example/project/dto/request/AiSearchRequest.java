package com.example.project.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiSearchRequest {

    @NotBlank(message = "Vui long nhap noi dung tim kiem")
    @Size(max = 500, message = "Noi dung tim kiem toi da 500 ky tu")
    private String message;
}
