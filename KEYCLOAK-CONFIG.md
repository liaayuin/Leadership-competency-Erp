# Keycloak Configuration Guide

Keycloak OIDC authentication and authorization setup for the Leadership Competency 360° Evaluation System.

## Contents

- [Overview](#overview)
- [Realm Setup](#realm-setup)
- [Roles](#roles)
- [Client Configuration](#client-configuration)
- [JWT Token Structure](#jwt-token-structure)
- [Authentication Flow](#authentication-flow)
- [User Provisioning](#user-provisioning)
- [Frontend Integration](#frontend-integration)
- [Backend Integration](#backend-integration)
- [Seeded Users](#seeded-users)
- [Troubleshooting](#troubleshooting)

## Overview

Keycloak 26 serves as the OIDC identity provider. It handles authentication, issues signed JWT tokens, and manages realm roles consumed by both the Next.js frontend and Spring Boot backend.

| Component | URL |
|-----------|-----|
| Keycloak Server | `http://localhost:8080` |
| Realm | `insa-realm` |
| Frontend Client | `insa-frontend` (public) |
| Admin Client | `admin-cli` (confidential) |

## Realm Setup

### Create Realm

1. Admin Console → `http://localhost:8080/admin`
2. Login: `admin` / `admin@123`
3. Create Realm → name: `insa-realm` → Create

### Token Lifespans

| Setting | Default | Notes |
|---------|---------|-------|
| Access Token Lifespan | 300s (5 min) | Short-lived, refresh via refresh token |
| Refresh Token Lifespan | 1800s (30 min) | |
| SSO Session Idle | 1800s | |
| SSO Session Max | 43200s (12h) | |

## Roles

### Realm Roles

| Role Name | Access Level |
|-----------|-------------|
| `ROLE_HR_ADMIN` | Full system access — admin panel, all reports, system config |
| `ROLE_MANAGEMENT` | Evaluation forms + subordinate reports (self-view blocked) |
| `ROLE_MOYTEGNA` | Evaluation forms only |

> The `ROLE_` prefix is required. Backend `JwtAuthenticationConverter` maps these directly to Spring Security authorities. `@PreAuthorize("hasAuthority('ROLE_HR_ADMIN')")` matches the exact Keycloak role string.

### Create via Admin Console

1. **Realm roles** → **Create role**
2. Enter name and description
3. Create each of the three roles

### Create via REST API

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" -d "username=admin" -d "password=admin@123" \
  -d "grant_type=password" | jq -r '.access_token')

for ROLE in ROLE_HR_ADMIN ROLE_MANAGEMENT ROLE_MOYTEGNA; do
  curl -X POST http://localhost:8080/admin/realms/insa-realm/roles \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$ROLE\"}"
done
```

## Client Configuration

### Client 1: `insa-frontend` (Public)

Used by the Next.js application for OIDC authentication.

| Setting | Value |
|---------|-------|
| Client ID | `insa-frontend` |
| Client authentication | OFF (Public) |
| Standard flow | ON |
| Direct access grants | ON |
| Valid redirect URIs | `http://localhost:3000/*` |
| Valid post logout redirect URIs | `http://localhost:3000/*` |
| Web origins | `http://localhost:3000` |

**Scopes:** `openid`, `profile`, `email`, `roles` (default realm roles mapper includes `realm_access.roles`)

### Client 2: `admin-cli` (Confidential)

Used by `KeycloakService.java` for programmatic user provisioning during database seeding.

| Setting | Value |
|---------|-------|
| Client ID | `admin-cli` |
| Client authentication | ON (Confidential) |
| Service accounts roles | ON |
| Direct access grants | ON |
| Standard flow | OFF |

**Service account roles** (required for user creation):

| Role | Client |
|------|--------|
| `manage-users` | `realm-management` |
| `create-client` | `realm-management` |
| `query-users` | `realm-management` |
| `query-groups` | `realm-management` |
| `view-users` | `realm-management` |

The current backend implementation authenticates as the admin user directly rather than using service accounts:

```java
Keycloak keycloak = KeycloakBuilder.builder()
    .serverUrl("http://localhost:8080")
    .realm("master")
    .username("admin")
    .password("admin@123")
    .clientId("admin-cli")
    .build();
```

## JWT Token Structure

### Claims Used by the Application

| Claim | Source | Usage |
|-------|--------|-------|
| `sub` | Keycloak UUID | Maps to `Employee.keycloakId` in auth lookup |
| `preferred_username` | User profile | Maps to `Employee.id` (business ID), identifies evaluation submitter |
| `realm_access.roles` | Built-in | Spring Security authorities via `JwtAuthenticationConverter` |
| `email` | User profile | Auto-generated as `username@insa.gov.et` |

### Token Validation Chain

```
Request → Authorization: Bearer <JWT>
  → Spring Security OAuth2 Resource Server
  → JWKS fetch from http://localhost:8080/realms/insa-realm/protocol/openid-connect/certs
  → RS256 signature validation
  → Issuer validation: http://localhost:8080/realms/insa-realm
  → Expiration validation
  → JwtAuthenticationConverter: realm_access.roles → List<GrantedAuthority>
  → @PreAuthorize enforcement
```

### Sample Token Payload

```json
{
  "sub": "f18c1d2a-8a18-42dc-b9f5-c65174677911",
  "preferred_username": "EMP-001",
  "realm_access": { "roles": ["ROLE_MOYTEGNA", "default-roles-insa-realm"] },
  "email": "EMP-001@insa.gov.et"
}
```

## Authentication Flow

### PKCE (Authorization Code + Proof Key for Code Exchange)

```
1. User visits http://localhost:3000
2. ReactKeycloakProvider redirects to Keycloak:
   GET /realms/insa-realm/protocol/openid-connect/auth?
     response_type=code&
     client_id=insa-frontend&
     code_challenge_method=S256&
     code_challenge=<hash>&
     redirect_uri=http://localhost:3000
3. User enters credentials at Keycloak login page
4. Keycloak returns authorization code via redirect
5. keycloak-js exchanges code + code_verifier for tokens:
   POST /realms/insa-realm/protocol/openid-connect/token
6. Tokens (access_token, refresh_token, id_token) stored in memory
7. App renders, fetches /api/auth/me with Bearer token
```

### Token Refresh

```typescript
const getFreshToken = async () => {
  try {
    await keycloak?.updateToken(30);  // Refresh if expiring in < 30s
    return keycloak?.token;
  } catch {
    keycloak?.login();  // Force re-login
    return null;
  }
};
```

### Logout

```typescript
keycloak.logout();  // Redirects to Keycloak logout → http://localhost:3000
```

## User Provisioning

The `DatabaseSeeder` calls `KeycloakService.createKeycloakUser()` for each employee during startup.

### User Creation Flow

```
KeycloakService.createKeycloakUser(username, firstName, lastName, roleName)
  → Keycloak Admin API: POST /admin/realms/insa-realm/users
  → User created with username=employeeId, password=Welcome@123, email=id@insa.gov.et
  → If HTTP 201: extract UUID from Location header
  → If HTTP 409: search existing user by username, fetch UUID
  → Assign realm role via: POST /admin/realms/insa-realm/users/{uuid}/role-mappings/realm
  → Return UUID → stored as Employee.keycloakId
```

### User Mapping

The `/api/auth/me` endpoint maps authenticated users to database employees:

1. Primary: `EmployeeRepository.findByKeycloakId(sub)` — match by Keycloak UUID
2. Fallback: `findByIdIgnoreCaseWithDetails(preferred_username)` — match by business ID

## Frontend Integration

### Configuration

File: `src/lib/keycloak.ts`

```typescript
import Keycloak from "keycloak-js";
const keycloakConfig = {
  url: "http://localhost:8080",
  realm: "insa-realm",
  clientId: "insa-frontend",
};
const keycloak =
  typeof window !== "undefined" ? new Keycloak(keycloakConfig) : undefined;
export default keycloak;
```

The `typeof window !== "undefined"` guard prevents instantiation during SSR.

### Provider

File: `src/providers/KeycloakProvider.tsx`

```tsx
<ReactKeycloakProvider
  authClient={keycloak}
  initOptions={{
    onLoad: "login-required",   // Immediate redirect to Keycloak
    pkceMethod: "S256",          // PKCE for secure code exchange
    checkLoginIframe: false,      // Avoid CORS issues in development
  }}
  LoadingComponent={<LoadingScreen />}
>
  {children}
</ReactKeycloakProvider>
```

Includes a mount guard (`useState`/`useEffect`) to prevent SSR/hydration mismatch.

### Role Checking

```typescript
const { keycloak } = useKeycloak();
const isHRAdmin = keycloak?.hasRealmRole("ROLE_HR_ADMIN");
const isManagement = keycloak?.hasRealmRole("ROLE_MANAGEMENT");
```

## Backend Integration

### Dependencies (pom.xml)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
<dependency>
    <groupId>org.keycloak</groupId>
    <artifactId>keycloak-admin-client</artifactId>
    <version>24.0.0</version>
</dependency>
```

### JWT Validation (application.properties)

```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/insa-realm
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8080/realms/insa-realm/protocol/openid-connect/certs
```

### JwtAuthenticationConverter (SecurityConfig.java)

```java
converter.setJwtGrantedAuthoritiesConverter(jwt -> {
    Map<String, Object> realmAccess = jwt.getClaim("realm_access");
    if (realmAccess == null || !realmAccess.containsKey("roles")) {
        return Collections.emptyList();
    }
    Collection<String> roles = (Collection<String>) realmAccess.get("roles");
    return roles.stream()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
});
```

Roles are used as-is — no `ROLE_` prefix is added or stripped.

### Endpoint Security

| Endpoint | Annotation | Access |
|----------|-----------|--------|
| `/api/auth/me` | `isAuthenticated()` | Any authenticated user |
| `/api/auth/search` | `isAuthenticated()` | Any authenticated user |
| `/api/evaluations` | (default) | Any authenticated user |
| `/api/reports/summary` | `hasAnyAuthority('ROLE_HR_ADMIN','ROLE_MANAGEMENT')` | HR Admin + Management |
| `/api/admin/**` (write) | `hasAuthority('ROLE_HR_ADMIN')` | HR Admin only |
| `/api/admin/categories` (GET) | `isAuthenticated()` | Any (needed for form rendering) |

### Report Access Control (programmatic)

- **HR Admin**: unrestricted — can view any employee's report
- **Management**: cannot view own report (403), can only view direct subordinates via `checkIfSubordinate()`

## Seeded Users

### HR Admin

| ID | Name | Password | Role |
|----|------|----------|------|
| `hr-002` | ሰሎሞን ጌታቸው ደሳለኝ | `Welcome@123` | `ROLE_HR_ADMIN` |

### Director / Supervisor

| ID | Name | Password | Role |
|----|------|----------|------|
| `mgmt-director-01` | ፋሲል በቀለ አየለ | `Welcome@123` | `ROLE_MANAGEMENT` |

### Managers (10)

`MGMT-100` through `MGMT-109` — all password `Welcome@123`, role `ROLE_MANAGEMENT`

### Regular Employees (60)

`EMP-001` through `EMP-060` — all password `Welcome@123`, role `ROLE_MOYTEGNA`

## Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| 401 on all API calls | Token expired | Ensure `updateToken(30)` is called before requests |
| CORS errors | Origin not whitelisted | Verify `http://localhost:3000` in CORS config and Keycloak client Web Origins |
| Issuer mismatch | Wrong realm in config | Verify `issuer-uri` matches actual Keycloak realm (case-sensitive) |
| 409 during seeding | User already exists | Normal — handled gracefully, fetches existing UUID |
| Role not found during seeding | Roles not created | Create three realm roles before starting backend |
| Login redirect loop | Wrong redirect URIs | Ensure `http://localhost:3000/*` in Valid Redirect URIs (with wildcard) |
| sub claim not matching employee | keycloakId not stored | Verify seeder ran and `Employee.keycloakId` is populated |
| 403 on reports for management | Self-view blocked | Management cannot view own report — only subordinates |

### Verification Commands

```bash
# Check Keycloak metadata
curl http://localhost:8080/realms/insa-realm/.well-known/openid-configuration

# Test token acquisition
TOKEN=$(curl -s -X POST http://localhost:8080/realms/insa-realm/protocol/openid-connect/token \
  -d "client_id=insa-frontend" -d "username=EMP-001" \
  -d "password=Welcome@123" -d "grant_type=password" | jq -r '.access_token')

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/auth/me

# Verify admin role access (use hr-002 token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/admin/config/weights
```
