package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.CompetencyCategory;

public interface CompetencyCategoryRepository extends JpaRepository<CompetencyCategory, Long> {
}