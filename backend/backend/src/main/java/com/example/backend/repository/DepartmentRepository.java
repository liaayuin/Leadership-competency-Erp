package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.model.Department;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Integer> {
}