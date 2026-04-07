package com.hoscor.dto;

import com.hoscor.domain.enums.ResponseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotResponseDto {

    private ResponseType type;
    private String message;
    private Object data;
    private String actionType;
    private Map<String, Object> params;
    private String summary;
}
