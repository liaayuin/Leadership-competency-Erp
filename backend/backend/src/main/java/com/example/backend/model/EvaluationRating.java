package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "evaluation_ratings")
public class EvaluationRating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String competencyKey;
    private Integer score;
    private Double weightedScore;

    @ManyToOne
    @JoinColumn(name = "header_id")
    @JsonBackReference
    private EvaluationHeader header;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompetencyKey() {
        return competencyKey;
    }

    public void setCompetencyKey(String competencyKey) {
        this.competencyKey = competencyKey;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Double getWeightedScore() {
        return weightedScore;
    }

    public void setWeightedScore(Double weightedScore) {
        this.weightedScore = weightedScore;
    }

    public EvaluationHeader getHeader() {
        return header;
    }

    public void setHeader(EvaluationHeader header) {
        this.header = header;
    }
}