package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.model.EvaluationHeader;

public interface EvaluationRepository extends JpaRepository<EvaluationHeader, Long> {

        List<EvaluationHeader> findByLeadershipIdAndBudgetYear(String leadershipId, String budgetYear);

        List<EvaluationHeader> findByLeadershipIdAndBudgetYearAndRaterDeptId(
                        String leadershipId,
                        String budgetYear,
                        Integer raterDeptId);

        @Query("SELECT e FROM EvaluationHeader e WHERE e.leadershipId = :leaderId " +
                        "AND e.budgetYear = :year " +
                        "AND e.raterParentDeptId = :parentId " +
                        "AND e.raterDeptId <> :myDeptId " +
                        "AND e.raterPositionLevel = 2")
        List<EvaluationHeader> findPeersByHierarchy(
                        @Param("leaderId") String leaderId,
                        @Param("year") String year,
                        @Param("parentId") Integer parentId,
                        @Param("myDeptId") Integer myDeptId);
}