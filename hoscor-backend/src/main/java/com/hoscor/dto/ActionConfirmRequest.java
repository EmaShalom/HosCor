package com.hoscor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class ActionConfirmRequest {

    @NotBlank
    private String actionType;

    private Map<String, Object> params;
}
