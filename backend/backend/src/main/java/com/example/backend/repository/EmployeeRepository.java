package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.model.Employee;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {

        @Query("SELECT e FROM Employee e " +
                        "LEFT JOIN FETCH e.department " +
                        "LEFT JOIN FETCH e.position " +
                        "WHERE e.keycloakId = :keycloakId")
        Optional<Employee> findByKeycloakId(@Param("keycloakId") String keycloakId);

        @Query("SELECT e FROM Employee e " +
                        "LEFT JOIN FETCH e.department " +
                        "LEFT JOIN FETCH e.position " +
                        "WHERE LOWER(e.id) = LOWER(:id)")
        Optional<Employee> findByIdIgnoreCaseWithDetails(@Param("id") String id);

        @Query("SELECT e FROM Employee e " +
                        "LEFT JOIN FETCH e.department " +
                        "LEFT JOIN FETCH e.position " +
                        "WHERE e.id = :id")
        Optional<Employee> findByIdWithDetails(@Param("id") String id);

        @Query("SELECT e FROM Employee e " +
                        "LEFT JOIN FETCH e.department " +
                        "LEFT JOIN FETCH e.position " +
                        "WHERE LOWER(e.id) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                        "LOWER(CONCAT(e.firstName, ' ', COALESCE(e.middleName, ''), ' ', e.lastName)) " +
                        "LIKE LOWER(CONCAT('%', :query, '%'))")
        List<Employee> searchByIdOrName(@Param("query") String query);

        @Query("SELECT e FROM Employee e " +
                        "LEFT JOIN FETCH e.department " +
                        "LEFT JOIN FETCH e.position " +
                        "WHERE e.role IN ('ROLE_MANAGEMENT', 'ROLE_HR_ADMIN') " +
                        "AND (" +
                        "  LOWER(e.id) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                        "  LOWER(CONCAT(e.firstName, ' ', COALESCE(e.middleName, ''), ' ', e.lastName)) " +
                        "  LIKE LOWER(CONCAT('%', :query, '%'))" +
                        ")")
        List<Employee> searchLeadersByIdOrName(@Param("query") String query);
}
