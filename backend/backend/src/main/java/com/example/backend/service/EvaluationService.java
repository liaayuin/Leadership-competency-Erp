package com.example.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.model.CompetencyLookup;
import com.example.backend.model.Employee;
import com.example.backend.model.EvaluationHeader;
import com.example.backend.model.EvaluationRating;
import com.example.backend.repository.CompetencyLookupRepository;
import com.example.backend.repository.EmployeeRepository;
import com.example.backend.repository.EvaluationRepository;

@Service
public class EvaluationService {

    private final EvaluationRepository evaluationRepo;
    private final CompetencyLookupRepository lookupRepo;
    private final EmployeeRepository employeeRepo;

    public EvaluationService(EvaluationRepository evaluationRepo,
            CompetencyLookupRepository lookupRepo,
            EmployeeRepository employeeRepo) {
        this.evaluationRepo = evaluationRepo;
        this.lookupRepo = lookupRepo;
        this.employeeRepo = employeeRepo;
    }

    @Transactional
    public EvaluationHeader save(EvaluationHeader evaluation) {
        enrichAndSetRole(evaluation);

        boolean isDirectorLevel = evaluation.getRaterPositionLevel() != null
                && evaluation.getRaterPositionLevel() <= 2;

        double totalScore = 0.0;
        if (evaluation.getRatings() != null) {
            for (EvaluationRating rating : evaluation.getRatings()) {
                CompetencyLookup item = lookupRepo.findByLookupKey(rating.getCompetencyKey())
                        .orElseThrow(() -> new RuntimeException("Lookup Key Not Found: " + rating.getCompetencyKey()));

                double competencyWeight = isDirectorLevel
                        ? item.getWeightDirector()
                        : item.getWeightDivision();

                double competencyScore = (rating.getScore().doubleValue() / 5.0) * competencyWeight;
                rating.setWeightedScore(competencyScore);
                rating.setHeader(evaluation);
                totalScore += competencyScore;
            }
        }

        evaluation.setTotalScore(totalScore);
        return evaluationRepo.save(evaluation);
    }

    private void enrichAndSetRole(EvaluationHeader evaluation) {
        Employee leader = employeeRepo.findById(evaluation.getLeadershipId())
                .orElseThrow(() -> new RuntimeException("Target Leader not found"));
        Employee rater = employeeRepo.findById(evaluation.getFilledBy())
                .orElseThrow(() -> new RuntimeException("Rater not found"));

        Integer leaderDeptId = leader.getDepartment() != null ? leader.getDepartment().getId() : null;
        Integer raterDeptId = rater.getDepartment() != null ? rater.getDepartment().getId() : null;

        Integer leaderParentId = (leader.getDepartment() != null && leader.getDepartment().getParent() != null)
                ? leader.getDepartment().getParent().getId()
                : null;
        Integer raterParentId = (rater.getDepartment() != null && rater.getDepartment().getParent() != null)
                ? rater.getDepartment().getParent().getId()
                : null;

        evaluation.setRaterDeptId(raterDeptId);
        evaluation.setRaterParentDeptId(raterParentId);
        evaluation.setRaterPositionLevel(rater.getPosition() != null ? rater.getPosition().getLevelWeight() : null);

        if (leader.getId().equalsIgnoreCase(rater.getId())) {
            // A. SELF
            evaluation.setRaterRole("SELF");

        } else if (raterParentId != null && raterParentId.equals(leaderDeptId)) {
            // B. SUBORDINATE:
            evaluation.setRaterRole("SUBORDINATE");

        } else if (leaderParentId != null && leaderParentId.equals(raterDeptId)) {
            // C. SUPERVISOR:
            evaluation.setRaterRole("SUPERVISOR");

        } else if (raterParentId != null && raterParentId.equals(leaderParentId)
                && !raterDeptId.equals(leaderDeptId)) {
            // D. PEER:
            evaluation.setRaterRole("PEER");

        } else if (raterDeptId != null && raterDeptId.equals(leaderDeptId)) {
            // E. Same dept (leaf-level colleagues) → treated as SUBORDINATE in 360
            evaluation.setRaterRole("SUBORDINATE");

        } else {
            evaluation.setRaterRole("OTHER");
        }
    }
}
