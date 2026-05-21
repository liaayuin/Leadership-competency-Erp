package com.example.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "hr_comp_category")
public class CompetencyCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Integer weightDiv;
    private Integer weightDir;

    public CompetencyCategory() {
    }

    public CompetencyCategory(Long id, String name, Integer weightDiv, Integer weightDir) {
        this.id = id;
        this.name = name;
        this.weightDiv = weightDiv;
        this.weightDir = weightDir;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getWeightDiv() {
        return weightDiv;
    }

    public void setWeightDiv(Integer weightDiv) {
        this.weightDiv = weightDiv;
    }

    public Integer getWeightDir() {
        return weightDir;
    }

    public void setWeightDir(Integer weightDir) {
        this.weightDir = weightDir;
    }
}