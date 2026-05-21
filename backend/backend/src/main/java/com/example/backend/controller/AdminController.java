package com.example.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.model.CompetencyCategory;
import com.example.backend.model.CompetencyLookup;
import com.example.backend.model.SystemConfig;
import com.example.backend.repository.CompetencyCategoryRepository;
import com.example.backend.repository.CompetencyLookupRepository;
import com.example.backend.repository.SystemConfigRepository;

@RestController
@RequestMapping("/api/admin")
/**
 * * Updated to use 'hasAuthority' with the exact Keycloak role string.
 * This works because our JwtAuthenticationConverter (in SecurityConfig)
 * extracts roles from 'realm_access.roles' with no prefix.
 */
@PreAuthorize("hasAuthority('ROLE_HR_ADMIN')")
public class AdminController {

    @Autowired
    private CompetencyCategoryRepository catRepo;
    @Autowired
    private CompetencyLookupRepository itemRepo;
    @Autowired
    private SystemConfigRepository configRepo;

    @GetMapping("/config/weights")
    public List<SystemConfig> getWeights() {
        return configRepo.findAll();
    }

    @PutMapping("/config/weights")
    public List<SystemConfig> updateWeights(@RequestBody List<SystemConfig> configs) {
        return configRepo.saveAll(configs);
    }

    @GetMapping("/categories")
    @PreAuthorize("isAuthenticated()") // All roles need this to render the evaluation form
    public List<CompetencyCategory> getCategories() {
        return catRepo.findAll();
    }

    @PostMapping("/categories")
    public CompetencyCategory saveCategory(@RequestBody CompetencyCategory category) {
        return catRepo.save(category);
    }

    @PutMapping("/categories/{id}")
    public CompetencyCategory updateCategory(@PathVariable Long id, @RequestBody CompetencyCategory details) {
        CompetencyCategory category = catRepo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        category.setName(details.getName());
        category.setWeightDiv(details.getWeightDiv());
        category.setWeightDir(details.getWeightDir());
        return catRepo.save(category);
    }

    @DeleteMapping("/categories/{id}")
    public void deleteCategory(@PathVariable Long id) {
        catRepo.deleteById(id);
    }

    @GetMapping("/categories/{catId}/competencies")
    @PreAuthorize("isAuthenticated()") // All roles need this to render the evaluation form
    public List<CompetencyLookup> getCompetenciesByCat(@PathVariable Long catId) {
        return itemRepo.findByCatId(catId);
    }

    /**
     * POST /api/admin/categories/{catId}/competencies
     * Saves a new competency under a specific category.
     */
    @PostMapping("/categories/{catId}/competencies")
    public CompetencyLookup saveCompetencyUnderCategory(
            @PathVariable Long catId,
            @RequestBody CompetencyLookup item) {
        item.setCatId(catId);
        if (item.getLookupKey() == null || item.getLookupKey().isBlank()) {
            item.setLookupKey(
                    item.getName().trim()
                            .replaceAll("\\s+", "_")
                            .replaceAll("[^\\w_]", "")
                            .toUpperCase()
                            + "_" + catId);
        }
        return itemRepo.save(item);
    }

    @PostMapping("/competencies")
    public CompetencyLookup saveCompetency(@RequestBody CompetencyLookup item) {
        if (item.getLookupKey() == null || item.getLookupKey().isBlank()) {
            item.setLookupKey(
                    item.getName().trim()
                            .replaceAll("\\s+", "_")
                            .replaceAll("[^\\w_]", "")
                            .toUpperCase()
                            + "_" + item.getCatId());
        }
        return itemRepo.save(item);
    }

    @PutMapping("/competencies/{id}")
    public CompetencyLookup updateCompetency(@PathVariable Long id, @RequestBody CompetencyLookup details) {
        CompetencyLookup item = itemRepo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        item.setName(details.getName());
        item.setWeightDivision(details.getWeightDivision());
        item.setWeightDirector(details.getWeightDirector());
        return itemRepo.save(item);
    }

    @DeleteMapping("/competencies/{id}")
    public void deleteCompetency(@PathVariable Long id) {
        itemRepo.deleteById(id);
    }
}