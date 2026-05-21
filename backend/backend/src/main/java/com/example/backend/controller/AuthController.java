package com.example.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.model.Employee;
import com.example.backend.repository.EmployeeRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyProfile(JwtAuthenticationToken token) {
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String keycloakSub = token.getTokenAttributes().get("sub").toString();

        Object prefUsername = token.getTokenAttributes().get("preferred_username");
        String employeeId = prefUsername != null ? prefUsername.toString() : null;

        Optional<Employee> found = employeeRepository.findByKeycloakId(keycloakSub);

        if (found.isEmpty() && employeeId != null) {
            System.out.println("⚠️  No match by keycloakId (" + keycloakSub
                    + ") — falling back to preferred_username: " + employeeId);
            found = employeeRepository.findByIdIgnoreCaseWithDetails(employeeId);
        }

        if (found.isPresent()) {
            return ResponseEntity.ok(found.get());
        }

        System.err.println("❌ Employee not found. sub=" + keycloakSub
                + " preferred_username=" + employeeId);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                "Employee not found. Keycloak sub=" + keycloakSub
                        + ", preferred_username=" + employeeId
                        + ". Ensure the employee was seeded and keycloakId is stored.");
    }

    /**
     * Search LEADERS (evaluatees) by ID or name.
     * Only returns ROLE_MANAGEMENT and ROLE_HR_ADMIN employees —
     * these are the people who can be rated as leaders.
     * ROLE_MOYTEGNA (normal staff) are excluded from results.
     */
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Employee>> searchEmployees(@RequestParam("q") String query) {
        List<Employee> results = employeeRepository.searchLeadersByIdOrName(query);
        return ResponseEntity.ok(results);
    }
}
