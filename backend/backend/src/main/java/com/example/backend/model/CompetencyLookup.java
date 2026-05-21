package com.example.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "hr_comp_weight")
public class CompetencyLookup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String lookupKey;
    private Integer weightDivision;
    private Integer weightDirector;
    private Long catId;

    public CompetencyLookup() {
    }

    public CompetencyLookup(Long id, String name, String lookupKey, Integer weightDivision, Integer weightDirector,
            Long catId) {
        this.id = id;
        this.name = name;
        this.lookupKey = lookupKey;
        this.weightDivision = weightDivision;
        this.weightDirector = weightDirector;
        this.catId = catId;
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

    public String getLookupKey() {
        return lookupKey;
    }

    public void setLookupKey(String lookupKey) {
        this.lookupKey = lookupKey;
    }

    public Integer getWeightDivision() {
        return weightDivision;
    }

    public void setWeightDivision(Integer weightDivision) {
        this.weightDivision = weightDivision;
    }

    public Integer getWeightDirector() {
        return weightDirector;
    }

    public void setWeightDirector(Integer weightDirector) {
        this.weightDirector = weightDirector;
    }

    public Long getCatId() {
        return catId;
    }

    public void setCatId(Long catId) {
        this.catId = catId;
    }
}