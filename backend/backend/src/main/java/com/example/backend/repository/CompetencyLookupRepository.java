package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.model.CompetencyLookup;

@Repository
public interface CompetencyLookupRepository extends JpaRepository<CompetencyLookup, Long> {

    Optional<CompetencyLookup> findByLookupKey(String lookupKey);

    List<CompetencyLookup> findByCatId(Long catId);
}