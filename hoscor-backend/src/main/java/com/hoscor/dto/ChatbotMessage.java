package com.hoscor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatbotMessage {

    @NotBlank
    private String message;
}
