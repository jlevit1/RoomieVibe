package com.example.project.dto.request;

import com.example.project.entity.Role;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GoogleLoginRequest {

    @NotBlank(message = "idToken khong duoc de trong")
    private String idToken;

    /** Chi ap dung khi tao tai khoan moi. Mac dinh USER neu bo trong. */
    private Role role;
}
