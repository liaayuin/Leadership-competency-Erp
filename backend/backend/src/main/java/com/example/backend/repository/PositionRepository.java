package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.model.Position;

@Repository
public interface PositionRepository extends JpaRepository<Position, Integer> {
}