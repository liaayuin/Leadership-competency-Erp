package com.example.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.Dto.EvaluationReportDTO;
import com.example.backend.service.ReportService;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_HR_ADMIN', 'ROLE_MANAGEMENT')")
    public ResponseEntity<?> getSummary(
            @RequestParam String id,
            @RequestParam String year,
            JwtAuthenticationToken token) {

        String requesterId = token.getTokenAttributes().get("preferred_username").toString();

        boolean isHrAdmin = token.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR_ADMIN"));

        try {
            if (isHrAdmin) {
                EvaluationReportDTO dto = reportService.getSummaryUnrestricted(id, year);
                return ResponseEntity.ok(dto);
            }

            // ROLE_MANAGEMENT: self-view blocked
            if (requesterId.equalsIgnoreCase(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("ራስዎን ማስቀረት አይችሉም። / Self-view is not permitted.");
            }

            // ROLE_MANAGEMENT: subordinate check
            boolean isAuthorized = reportService.checkIfSubordinate(requesterId, id);
            if (!isAuthorized) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("ይህንን ሪፖርት ለማየት ፈቃድ የለዎትም። "
                                + "ቀጥተኛ ኃላፊዎች ብቻ የበታቾቻቸውን ሪፖርት ማየት ይችላሉ።");
            }

            EvaluationReportDTO dto = reportService.getSummary(id, year, requesterId);
            return ResponseEntity.ok(dto);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("የዓ.ም ስህተት: " + e.getMessage());
        } catch (RuntimeException e) {
            // Employee not found, etc.
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }
}