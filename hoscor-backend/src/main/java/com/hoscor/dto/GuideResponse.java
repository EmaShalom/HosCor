package com.hoscor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuideResponse {

    private String title;
    private String section;
    private String sectionRoute;
    private String context;
    private List<String> steps;
    private String tip;
    private List<String> smartSuggestions;
    private List<String> decisionRules;
    private List<String> warnings;
    private List<String> troubleshooting;
    private List<String> relatedActions;
}
