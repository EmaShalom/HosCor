package com.hoscor.dto;

import com.hoscor.domain.enums.ResponseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntelligenceResult {

    private ResponseType type;
    private String message;
    private Object data;
    private String actionType;

    public static IntelligenceResult metric(String message, Object data) {
        return IntelligenceResult.builder()
                .type(ResponseType.METRIC)
                .message(message)
                .data(data)
                .build();
    }

    public static IntelligenceResult table(String message, Object data) {
        return IntelligenceResult.builder()
                .type(ResponseType.TABLE)
                .message(message)
                .data(data)
                .build();
    }

    public static IntelligenceResult alert(String message, Object data) {
        return IntelligenceResult.builder()
                .type(ResponseType.ALERT)
                .message(message)
                .data(data)
                .build();
    }

    public static IntelligenceResult text(String message) {
        return IntelligenceResult.builder()
                .type(ResponseType.TEXT)
                .message(message)
                .build();
    }

    public static IntelligenceResult chart(String message, Object data) {
        return IntelligenceResult.builder()
                .type(ResponseType.CHART_DATA)
                .message(message)
                .data(data)
                .build();
    }

    public static IntelligenceResult cards(String message, Object data) {
        return IntelligenceResult.builder()
                .type(ResponseType.PATIENT_CARDS)
                .message(message)
                .data(data)
                .build();
    }
}
