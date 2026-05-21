# Leadership Competency 360° Evaluation System

Multi-source 360-degree leadership competency evaluation system for **INSA (Information Network Security Administration)**. Leaders are evaluated by their **supervisors, peers, subordinates, and themselves** through weighted competency scoring with configurable role-group weights and qualitative bonuses.

## Contents

- [Project Overview](#project-overview)
- [Modules](#modules)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [Authentication and Roles](#authentication-and-roles)
- [API Areas](#api-areas)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)

## Project Overview

The system enables 360° feedback collection where employees evaluate leaders across 6 competency categories (22 competencies total) using a 1-5 scale. The backend auto-classifies each evaluation into **SUPERVISOR**, **PEER**, **SUBORDINATE**, or **SELF** based on department hierarchy, then computes a weighted final score using configurable role-group weights.

Two rater scoring paths exist: **Division-level** (position level > 2) and **Director-level** (position level ≤ 2), each with independently configured competency weights.

The frontend communicates with a single backend service:

- Backend service: `http://localhost:8081`

Authentication is handled through Keycloak using `@react-keycloak/web` on the frontend and OAuth2 resource server JWT validation on the backend.

## Modules

### Evaluation Form Module

- Employee search by ID or name with debounced autocomplete
- Competency rating across 6 Amharic-language categories on a 1-5 scale
- Qualitative assessment fields: Identity/Integrity (High/Medium/Low) and Public Service (Excellent/Good/Satisfactory)
- Ethiopian calendar date picker for evaluation period
- Auto-detected rater role assignment based on department hierarchy
- Weighted score computation per competency with dual-path (Division/Director) support

### Reports Module

- 360° report generation with role-group breakdown (Supervisor/Peer/Subordinate/Self)
- Configurable role-group weights (must sum to 100)
- Optional qualitative bonus scoring
- Ethiopian year selector for historical reports
- Detail modal with per-evaluator competency scores
- HR Admin unrestricted access vs Management subordinate-only access

### Administration Module

- Role-weight configuration panel (Supervisor/Peer/Subordinate/Self) with real-time sum validation
- Qualitative bonus weight configuration (Integrity/Public Service)
- Competency category CRUD with Division/Director weight management
- Competency CRUD within categories with per-category weight sum validation
- Toast notifications for save confirmations

### System Seeding Module

- Automatic database seeding on first startup (via `CommandLineRunner`)
- Keycloak user provisioning for all seeded employees (72 users total)
- Hierarchical department structure seeding
- Position levels, competency categories, and lookup definitions
- Default system configuration weights

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- `@react-keycloak/web` (Keycloak React bindings)
- `keycloak-js` (Keycloak browser adapter)

### Backend

- Java 21
- Spring Boot 4.0.5
- Spring Web MVC
- Spring Data JPA
- Spring Security OAuth2 Resource Server
- MySQL Connector
- Lombok
- Keycloak Admin Client 24.0.0
- RESTEasy Client 6.2.7.Final
- Maven

### Authentication

- Keycloak 26
- OIDC Authorization Code flow with PKCE (S256)
- JWT bearer tokens
- Realm roles used for authorization

## Repository Structure

```text
.
├── backend/backend/              # Spring Boot backend service
│   └── src/main/java/com/example/backend/
│       ├── config/               # SecurityConfig, DatabaseSeeder
│       ├── controller/           # Auth, Evaluation, Report, Admin controllers
│       ├── service/              # KeycloakService, EvaluationService, ReportService
│       ├── repository/           # JPA repositories
│       ├── model/                # JPA entities
│       └── Dto/                  # EvaluationReportDTO
├── leadership-competency/        # Next.js frontend application
│   ├── app/                      # Layout, pages, global CSS
│   └── src/
│       ├── components/forms/     # Dashboard, Sidebar, Form, Report, Admin components
│       ├── lib/                  # Keycloak client config
│       ├── providers/            # KeycloakProvider wrapper
│       └── constants/            # Competency definitions
├── KEYCLOAK-CONFIG.md            # Keycloak configuration guide
├── DATABASE-SCHEMA.md            # Database schema documentation
└── README.md
```

The active backend service is `backend/backend`. The frontend is in `leadership-competency`.

## Prerequisites

Install the following before running the project:

- Java 21 or newer
- Node.js 20 or newer
- npm
- MySQL 8 or newer
- Keycloak 26 or newer

## Configuration

### Frontend Environment

Create `leadership-competency/.env.local`:

```env
KEYCLOAK_ISSUER=http://localhost:8080/realms/insa-realm
KEYCLOAK_CLIENT_ID=insa-frontend
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=yoursupersecretstringhere
```

### Backend

Default file: `backend/backend/src/main/resources/application.properties`

Important defaults:

```properties
server.port=8081
spring.datasource.url=jdbc:mysql://localhost:3306/leadershipcompetency_db?useUnicode=yes&characterEncoding=UTF-8&allowPublicKeyRetrieval=true&useSSL=false
spring.datasource.username=root
spring.datasource.password=1604
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/insa-realm
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8080/realms/insa-realm/protocol/openid-connect/certs
spring.jpa.hibernate.ddl-auto=update
```

### Frontend Keycloak Config

File: `leadership-competency/src/lib/keycloak.ts`

```typescript
const keycloakConfig = {
  url: "http://localhost:8080",
  realm: "insa-realm",
  clientId: "insa-frontend",
};
```

The provider uses `onLoad: "login-required"`, `pkceMethod: "S256"`, and `checkLoginIframe: false`.

### Keycloak Admin Client

The `KeycloakService.java` uses admin credentials to provision users:

```java
KeycloakBuilder.builder()
    .serverUrl("http://localhost:8080")
    .realm("master")
    .username("admin")
    .password("admin@123")
    .clientId("admin-cli")
    .build();
```

For shared or production environments, move secrets out of committed properties files and provide them through environment variables.

## Database Setup

Create the MySQL database:

```sql
CREATE DATABASE leadershipcompetency_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

The service uses:

```properties
spring.jpa.hibernate.ddl-auto=update
```

This allows Hibernate to create and update tables automatically on startup. The seeder populates initial data when tables are empty.

### Tables

| Table                | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `departments`        | Hierarchical INSA org structure (8 departments, 3 levels deep) |
| `positions`          | Job positions with level weight (1=Head to 5=Junior)           |
| `employees`          | Employee records with Keycloak UUID mapping (72 seeded users)  |
| `hr_comp_category`   | 6 competency categories with Division/Director weights         |
| `hr_comp_weight`     | 24 competency definitions with per-category weights            |
| `evaluation_headers` | Evaluation submissions with rater role and total score         |
| `evaluation_ratings` | Per-competency scores within each evaluation                   |
| `system_config`      | Configurable role weights and qualitative bonus weights        |

Full schema documentation is in `DATABASE-SCHEMA.md`.

## Running the Project

Run each service in a separate terminal.

### 1. Start Keycloak

Start Keycloak on:

```text
http://localhost:8080
```

Required realm: `insa-realm`
Required client: `insa-frontend` (public)
Required realm roles: `ROLE_HR_ADMIN`, `ROLE_MANAGEMENT`, `ROLE_MOYTEGNA`

### 2. Start the Backend

```bash
cd backend/backend
./mvnw spring-boot:run
```

Service URL:

```text
http://localhost:8081
```

The seeder creates all database tables and provisions 72 Keycloak users on first startup.

### 3. Start the Frontend

```bash
cd leadership-competency
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

### 4. Login

Use the seeded credentials:

| Employee ID                   | Password      | Role              |
| ----------------------------- | ------------- | ----------------- |
| `hr-002`                      | `Welcome@123` | `ROLE_HR_ADMIN`   |
| `mgmt-director-01`            | `Welcome@123` | `ROLE_MANAGEMENT` |
| `MGMT-100` through `MGMT-109` | `Welcome@123` | `ROLE_MANAGEMENT` |
| `EMP-001` through `EMP-060`   | `Welcome@123` | `ROLE_MOYTEGNA`   |

## Authentication and Roles

The frontend signs users in with Keycloak through `@react-keycloak/web`. The backend validates JWT access tokens and authorizes requests using roles extracted from the `realm_access` claim.

### Role Mapping

| Role              | Authority        | Access                                                               |
| ----------------- | ---------------- | -------------------------------------------------------------------- |
| `ROLE_HR_ADMIN`   | HR Administrator | Full access — Admin panel, all reports (unrestricted), system config |
| `ROLE_MANAGEMENT` | Management       | Evaluation form, subordinate reports (self-view blocked)             |
| `ROLE_MOYTEGNA`   | Staff            | Evaluation form only                                                 |

### Role-Based UI

| Feature         | Staff | Management        | HR Admin          |
| --------------- | ----- | ----------------- | ----------------- |
| Evaluation Form | ✅    | ✅                | ✅                |
| Reports View    | ❌    | ✅ (subordinates) | ✅ (unrestricted) |
| Admin Panel     | ❌    | ❌                | ✅                |

### Frontend Role Checking

```typescript
const isManagement = keycloak.hasRealmRole("ROLE_MANAGEMENT");
const isHRAdmin = keycloak.hasRealmRole("ROLE_HR_ADMIN");
```

### JWT Token Structure

```json
{
  "sub": "f18c1d2a-8a18-42dc-b9f5-c65174677911",
  "preferred_username": "EMP-001",
  "realm_access": { "roles": ["ROLE_MOYTEGNA"] }
}
```

The `sub` claim maps to `Employee.keycloakId`. The `preferred_username` maps to `Employee.id` (business ID). Roles are used as-is from Keycloak with no prefix manipulation.

Full Keycloak configuration guide is in `KEYCLOAK-CONFIG.md`.

## API Areas

### Auth Service

Base URL: `http://localhost:8081`

- `GET /api/auth/me` — Current user profile (authenticated)
- `GET /api/auth/search?q=` — Search leaders by ID or name (authenticated)
- `GET /api/auth/login-help` — Public landing page (permit all)

### Evaluations

- `POST /api/evaluations` — Submit evaluation (authenticated)

### Reports

- `GET /api/reports/summary?id=&year=` — 360° report (`ROLE_HR_ADMIN` or `ROLE_MANAGEMENT`)

### Admin

- `GET/PUT /api/admin/config/weights` — Role weight CRUD (`ROLE_HR_ADMIN`)
- `GET/POST /api/admin/categories` — Category CRUD (read: authenticated, write: `ROLE_HR_ADMIN`)
- `PUT/DELETE /api/admin/categories/{id}` — Category update/delete (`ROLE_HR_ADMIN`)
- `GET /api/admin/categories/{catId}/competencies` — List competencies (authenticated)
- `POST /api/admin/categories/{catId}/competencies` — Add competency (`ROLE_HR_ADMIN`)
- `POST/PUT/DELETE /api/admin/competencies` — Competency CRUD (`ROLE_HR_ADMIN`)

## Common Commands

### Frontend

```bash
cd leadership-competency
npm run dev
npm run build
npm run start
npm run lint
```

### Backend

```bash
cd backend/backend
./mvnw spring-boot:run
./mvnw test
./mvnw clean package
```

## Troubleshooting

### Frontend cannot reach the API

Check that:

- The backend is running on `http://localhost:8081`
- Browser requests include a valid bearer token (Keycloak login successful)
- `Authorization` header is present in fetch calls

### Login or token validation fails

Check that:

- Keycloak is running on `http://localhost:8080`
- Realm name is `insa-realm`
- Frontend client ID is `insa-frontend`
- `KEYCLOAK_ISSUER` matches the backend `issuer-uri`
- Realm roles exist: `ROLE_HR_ADMIN`, `ROLE_MANAGEMENT`, `ROLE_MOYTEGNA`

### Database connection fails

Check that:

- MySQL is running
- `leadershipcompetency_db` exists with `utf8mb4` charset
- Database username and password match `application.properties`
- Port 3306 is the correct MySQL port

### CORS errors

The backend CORS configuration allows `http://localhost:3000`. If the frontend runs on a different port, update `SecurityConfig.java`:

```java
configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
```

### Seeder fails to create Keycloak users

Check that:

- Keycloak is running with admin credentials `admin / admin@123`
- Realm `insa-realm` exists
- Roles exist before the backend starts
- HTTP 409 is handled (graceful fallback to existing user lookup)

### /api/auth/me returns 404

The Keycloak UUID (`sub` claim) does not match any `keycloak_id` in the `employees` table. Either re-run the seeder or verify the `preferred_username` fallback matches an employee ID.

## Notes for Contributors

- Keep module-specific code inside its service or frontend component area.
- Do not commit real credentials, production secrets, or private Keycloak credentials.
- Competency weight sums must be validated: category-level and per-competency group weights must match.
- The role weight config must always sum to 100 for the numeric scoring path.
- Ethiopian years are used for budget years — Gregorian years (≥2024) are rejected by the backend.
- All UI labels are in Amharic with English subtitles.
