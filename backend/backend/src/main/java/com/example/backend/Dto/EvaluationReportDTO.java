package com.example.backend.Dto;

import java.util.List;

import com.example.backend.model.EvaluationHeader;

import lombok.Data;

@Data
public class EvaluationReportDTO {
    private String fullName;
    private String departmentName;
    private String jobTitle;

    private List<EvaluationHeader> supervisorRecords;
    private List<EvaluationHeader> peerRecords;
    private List<EvaluationHeader> subordinateRecords;
    private List<EvaluationHeader> selfRecords;

    // Role-group weights (from SystemConfig, editable in Admin)
    private int weightSupervisor;
    private int weightPeer;
    private int weightSubordinate;
    private int weightSelf;

    // Qualitative field weights (stored in SystemConfig, default 0)
    private int weightIntegrity;
    private int weightPublicService;

    // Computed contributions (each is a slice of the 100-point total)
    private double supervisorWeightedScore;
    private double peerWeightedScore;
    private double subordinateWeightedScore;
    private double selfWeightedScore;
    private double integrityScore;
    private double publicServiceScore;

    private double totalFinalScore;

    public void calculateTotalFinalScore() {
        this.totalFinalScore = supervisorWeightedScore + peerWeightedScore
                + subordinateWeightedScore + selfWeightedScore
                + integrityScore + publicServiceScore;
    }
}
