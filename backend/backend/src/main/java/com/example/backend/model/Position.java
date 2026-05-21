package com.example.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "positions")
public class Position {
    @Id
    private Integer id;

    private String title;

    private Integer levelWeight;
    private String positionName;

    public String getPositionName() {
        return positionName;
    }

    public Position() {
    }

    public Position(Integer id, String title, Integer levelWeight) {
        this.id = id;
        this.title = title;
        this.levelWeight = levelWeight;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getLevelWeight() {
        return levelWeight;
    }

    public void setLevelWeight(Integer levelWeight) {
        this.levelWeight = levelWeight;
    }
}