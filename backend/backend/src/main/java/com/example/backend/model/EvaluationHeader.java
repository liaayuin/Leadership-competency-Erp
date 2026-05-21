package com.example.backend.model;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "evaluation_headers")
public class EvaluationHeader {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String budgetYear;
    private String leadershipId;
    private String fullName;
    private String departmentName;
    private String jobTitle;
    private String startDate;
    private String endDate;

    // Summary categories
    private String identityIntegrity;
    private String publicService;

    private String filledBy;
    private String raterRole; // "SUBORDINATE", "PEER", "SELF", "SUPERVISOR"
    private Double totalScore;
    private Integer raterDeptId; // To confirm Subordinates are in YOUR division
    private Integer raterParentDeptId; // To confirm Peers share your "Common Boss"
    private Integer raterPositionLevel; // 1=Head, 2=Director, 3=Staff (To filter Peer Managers)

    @OneToMany(mappedBy = "header", cascade = CascadeType.ALL)
    private List<EvaluationRating> ratings;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBudgetYear() {
        return budgetYear;
    }

    public void setBudgetYear(String budgetYear) {
        this.budgetYear = budgetYear;
    }

    public String getLeadershipId() {
        return leadershipId;
    }

    public void setLeadershipId(String leadershipId) {
        this.leadershipId = leadershipId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public String getIdentityIntegrity() {
        return identityIntegrity;
    }

    public void setIdentityIntegrity(String identityIntegrity) {
        this.identityIntegrity = identityIntegrity;
    }

    public String getPublicService() {
        return publicService;
    }

    public void setPublicService(String publicService) {
        this.publicService = publicService;
    }

    public String getFilledBy() {
        return filledBy;
    }

    public void setFilledBy(String filledBy) {
        this.filledBy = filledBy;
    }

    public String getRaterRole() {
        return raterRole;
    }

    public void setRaterRole(String raterRole) {
        this.raterRole = raterRole;
    }

    public Double getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Double totalScore) {
        this.totalScore = totalScore;
    }

    public Integer getRaterDeptId() {
        return raterDeptId;
    }

    public void setRaterDeptId(Integer raterDeptId) {
        this.raterDeptId = raterDeptId;
    }

    public Integer getRaterParentDeptId() {
        return raterParentDeptId;
    }

    public void setRaterParentDeptId(Integer raterParentDeptId) {
        this.raterParentDeptId = raterParentDeptId;
    }

    public Integer getRaterPositionLevel() {
        return raterPositionLevel;
    }

    public void setRaterPositionLevel(Integer raterPositionLevel) {
        this.raterPositionLevel = raterPositionLevel;
    }

    public List<EvaluationRating> getRatings() {
        return ratings;
    }

    public void setRatings(List<EvaluationRating> ratings) {
        this.ratings = ratings;
    }
}