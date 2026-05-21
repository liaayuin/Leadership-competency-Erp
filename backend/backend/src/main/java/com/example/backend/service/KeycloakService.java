package com.example.backend.service;

import java.util.Collections;
import java.util.List;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;

import jakarta.ws.rs.core.Response;

@Service
public class KeycloakService {

    private final String SERVER_URL = "http://localhost:8080";
    private final String REALM = "insa-realm";

    /**
     * Creates a Keycloak user, assigns the realm role, and returns the
     * Keycloak UUID so the caller can persist it on the Employee entity.
     *
     * @param username  the employee's business ID (e.g. "EMP-001", "hr-002")
     *                  — this becomes the Keycloak username AND preferred_username
     *                  in the JWT
     * @param firstName
     * @param lastName
     * @param roleName  e.g. "ROLE_HR_ADMIN", "ROLE_MANAGEMENT", "ROLE_MOYTEGNA"
     * @return the Keycloak internal UUID (sub), or null if creation failed
     */
    public String createKeycloakUser(String username, String firstName,
            String lastName, String roleName) {

        Keycloak keycloak = KeycloakBuilder.builder()
                .serverUrl(SERVER_URL)
                .realm("master")
                .username("admin")
                .password("admin@123")
                .clientId("admin-cli")
                .build();

        UsersResource usersResource = keycloak.realm(REALM).users();

        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(username);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(username.toLowerCase() + "@insa.gov.et");

        CredentialRepresentation password = new CredentialRepresentation();
        password.setTemporary(false);
        password.setType(CredentialRepresentation.PASSWORD);
        password.setValue("Welcome@123");
        user.setCredentials(Collections.singletonList(password));

        Response response = usersResource.create(user);

        String keycloakUuid = null;

        if (response.getStatus() == 201) {
            // Extract the UUID from the Location header: .../users/{uuid}
            String location = response.getLocation().toString();
            keycloakUuid = location.substring(location.lastIndexOf('/') + 1);
            System.out.println("✅ Keycloak user created: " + username + " → uuid=" + keycloakUuid);

        } else if (response.getStatus() == 409) {
            System.out.println("⚠️  Keycloak user already exists: " + username + " — fetching UUID");
            List<UserRepresentation> existing = usersResource.search(username, true);
            if (!existing.isEmpty()) {
                keycloakUuid = existing.get(0).getId();
                System.out.println("   Existing UUID: " + keycloakUuid);
            }
        } else {
            System.err.println("❌ Keycloak user creation failed for " + username
                    + ": HTTP " + response.getStatus() + " " + response.getStatusInfo());
        }
        response.close();

        // Assign realm role
        if (keycloakUuid != null && roleName != null && !roleName.isBlank()) {
            try {
                RoleRepresentation role = keycloak.realm(REALM).roles()
                        .get(roleName).toRepresentation();
                keycloak.realm(REALM).users().get(keycloakUuid)
                        .roles().realmLevel()
                        .add(Collections.singletonList(role));
                System.out.println("✅ Role assigned: " + roleName + " → " + username);
            } catch (Exception e) {
                System.err.println("❌ Role assignment failed (" + roleName
                        + " → " + username + "): " + e.getMessage());
            }
        }

        return keycloakUuid;
    }

    public String createKeycloakUser(String username, String firstName, String lastName) {
        return createKeycloakUser(username, firstName, lastName, "ROLE_MOYTEGNA");
    }
}
