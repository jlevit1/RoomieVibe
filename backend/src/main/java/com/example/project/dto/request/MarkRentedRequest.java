package com.example.project.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarkRentedRequest {

    // Optional; recording the tenant is what lets them leave a verified review.
    private Long tenantId;
}
