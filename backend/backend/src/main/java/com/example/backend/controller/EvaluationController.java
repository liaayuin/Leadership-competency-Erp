package com.example.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.model.EvaluationHeader;
import com.example.backend.service.EvaluationService;

@RestController
@RequestMapping("/api/evaluations")
public class EvaluationController {

    private final EvaluationService service;

    public EvaluationController(EvaluationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<EvaluationHeader> submit(
            @RequestBody EvaluationHeader header,
            JwtAuthenticationToken token) {

        String loggedInUserId = token.getTokenAttributes().get("preferred_username").toString();
        header.setFilledBy(loggedInUserId);

        String budgetYear = header.getBudgetYear();
        if (budgetYear == null || budgetYear.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            int year = Integer.parseInt(budgetYear.trim());

            if (year >= 2024) {
                return ResponseEntity
                        .badRequest()
                        .<EvaluationHeader>build();
            }
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }

        EvaluationHeader saved = service.save(header);
        return ResponseEntity.ok(saved);
    }
}