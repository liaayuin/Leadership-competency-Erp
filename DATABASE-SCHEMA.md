# Database Schema Documentation

**Database:** MySQL 8+  
**Name:** `leadershipcompetency_db`  
**Charset:** `utf8mb4` / `utf8mb4_unicode_ci`  
**ORM:** JPA / Hibernate with `ddl-auto=update`

## Contents

- [Tables Overview](#tables-overview)
- [Entity Relationships](#entity-relationships)
- [Table: departments](#table-departments)
- [Table: positions](#table-positions)
- [Table: employees](#table-employees)
- [Table: hr_comp_category](#table-hr_comp_category)
- [Table: hr_comp_weight](#table-hr_comp_weight)
- [Table: evaluation_headers](#table-evaluation_headers)
- [Table: evaluation_ratings](#table-evaluation_ratings)
- [Table: system_config](#table-system_config)
- [Integrity Constraints](#integrity-constraints)
- [Key Queries](#key-queries)

## Tables Overview

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `departments` | Hierarchical INSA org structure | Self-referencing `parent_id` FK |
| `positions` | Job positions with level weight | Referenced by `employees.position_id` |
| `employees` | Employee records with Keycloak mapping | Links to departments, positions, manager |
| `hr_comp_category` | 6 competency categories with dual-path weights | Parent of `hr_comp_weight` |
| `hr_comp_weight` | 24 competency definitions | References category, matched by `lookup_key` |
| `evaluation_headers` | Evaluation submission records | References employee, stores denormalized data |
| `evaluation_ratings` | Per-competency scores | Child of `evaluation_headers` (cascade) |
| `system_config` | Configurable role/bonus weights | Key-value pairs, no FKs |

## Entity Relationships

```
departments (parent_id → departments.id)
  └── employees (department_id → departments.id)
        └── employees (manager_id → employees.id)
        └── evaluation_headers (filled_by, leadership_id → employees.id [logical])

positions (id)
  └── employees (position_id → positions.id)
  └── evaluation_headers (rater_position_level [denormalized])

hr_comp_category (id)
  └── hr_comp_weight (cat_id → hr_comp_category.id)

hr_comp_weight (lookup_key)
  └── evaluation_ratings (competency_key → hr_comp_weight.lookup_key [logical])

evaluation_headers (id)
  └── evaluation_ratings (header_id → evaluation_headers.id) [CASCADE DELETE]
```

## Table: `departments`

Hierarchical org structure. Self-referencing parent/child tree, 3 levels deep.

```sql
CREATE TABLE departments (
    id        INT          PRIMARY KEY,
    name      VARCHAR(255),
    parent_id INT,
    CONSTRAINT FK_parent FOREIGN KEY (parent_id) REFERENCES departments(id)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | PK | Department ID |
| `name` | `VARCHAR` | | Amharic department name |
| `parent_id` | `INT` | FK → departments.id | Parent department (NULL for root) |

### Seed Data

```
ID:1  የኢንስቲትዩቱ ዋና ዳይሬክተር ጽህፈት ቤት
 └── ID:2  የዲጂታላይዜሽን ዘርፍ
 │    ├── ID:5  የሶፍትዌር ልማት ቡድን
 │    │   ├── ID:8  የባክኤንድ ልማት ክፍል
 │    │   └── ID:9  የፍሮንትኤንድ ልማት ክፍል
 │    └── ID:7  የሰው ሃብት ስራ አመራር ቡድን
 ├── ID:3  የፋይናንስና አስተዳደር ዘርፍ
 └── ID:4  የሰው ሃብት ዋና ቡድን
```

### Role Detection Usage

| Relationship | Logic |
|-------------|-------|
| SUPERVISOR | `leader.dept.parent_id == rater.dept.id` |
| SUBORDINATE | `rater.dept.parent_id == leader.dept.id` |
| PEER | Same `parent_id`, different `id`, same position title |
| SELF | `rater == leader` |
| SAME DEPT | Same `id` → treated as SUBORDINATE |

## Table: `positions`

Job positions with a numeric level weight determining the scoring path.

```sql
CREATE TABLE positions (
    id            INT    PRIMARY KEY,
    title         VARCHAR(255),
    level_weight  INT,
    position_name VARCHAR(255)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | PK | Position ID |
| `title` | `VARCHAR` | | Position title (Amharic) |
| `level_weight` | `INT` | | 1=Head, 2=Director, 3=Leader, 4=Senior, 5=Junior |
| `position_name` | `VARCHAR` | | Alternative field (not consistently used) |

### Seed Data

| id | title | level_weight |
|----|-------|-------------|
| 1 | ዋና ዳይሬክተር | 1 |
| 2 | ዳይሬክተር | 2 |
| 3 | የቡድን መሪ | 3 |
| 4 | ከፍተኛ ባለሙያ | 4 |
| 5 | ባለሙያ | 5 |

**Scoring impact:** `level_weight ≤ 2` uses `weightDirector`; `level_weight > 2` uses `weightDivision`.

## Table: `employees`

Employee records linking Keycloak identities to organizational data.

```sql
CREATE TABLE employees (
    id            VARCHAR(255) PRIMARY KEY,
    keycloak_id   VARCHAR(255) UNIQUE,
    first_name    VARCHAR(255) NOT NULL,
    middle_name   VARCHAR(255),
    last_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(255) NOT NULL,
    department_id INT,
    position_id   INT,
    manager_id    VARCHAR(255),
    CONSTRAINT FK_dept  FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT FK_pos   FOREIGN KEY (position_id)   REFERENCES positions(id),
    CONSTRAINT FK_mgr   FOREIGN KEY (manager_id)    REFERENCES employees(id)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `VARCHAR(255)` | PK | Business ID (e.g. `EMP-001`, `hr-002`, `MGMT-100`) |
| `keycloak_id` | `VARCHAR(255)` | UNIQUE | Keycloak UUID from JWT `sub` claim |
| `first_name` | `VARCHAR` | NOT NULL | Amharic first name |
| `middle_name` | `VARCHAR` | | Amharic middle name |
| `last_name` | `VARCHAR` | NOT NULL | Amharic last name |
| `role` | `VARCHAR` | NOT NULL | `ROLE_HR_ADMIN`, `ROLE_MANAGEMENT`, or `ROLE_MOYTEGNA` |
| `department_id` | `INT` | FK | Department assignment |
| `position_id` | `INT` | FK | Position assignment |
| `manager_id` | `VARCHAR(255)` | FK | Direct manager |

### Fetch Strategies

- `department`: EAGER — always loaded
- `position`: EAGER — always loaded
- `manager`: LAZY — loaded on demand

### Seed Data Summary

| Role | Count | ID Pattern |
|------|-------|-----------|
| `ROLE_HR_ADMIN` | 1 | `hr-002` |
| `ROLE_MANAGEMENT` | 11 | `mgmt-director-01`, `MGMT-100` to `MGMT-109` |
| `ROLE_MOYTEGNA` | 60 | `EMP-001` to `EMP-060` |

### Repository Queries

```java
// Auth: find by Keycloak UUID (primary)
Optional<Employee> findByKeycloakId(String keycloakId);

// Auth fallback: find by business ID
Optional<Employee> findByIdIgnoreCaseWithDetails(String id);

// Search: only MANAGEMENT and HR_ADMIN roles
List<Employee> searchLeadersByIdOrName(String query);
```

## Table: `hr_comp_category`

Competency categories with separate weights for Division-level and Director-level raters.

```sql
CREATE TABLE hr_comp_category (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255),
    weight_div INT,
    weight_dir INT
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `BIGINT` | PK, AUTO_INCREMENT | Category ID |
| `name` | `VARCHAR` | | Amharic category name |
| `weight_div` | `INT` | | Points for Division-level raters (all cats sum to 100) |
| `weight_dir` | `INT` | | Points for Director-level raters (all cats sum to 100) |

### Seed Data

| id | Name (Amharic) | Translation | Div | Dir |
|----|----------------|-------------|----|-----|
| 1 | ለውጥ መምራት | Leading Change | 20 | 25 |
| 2 | ሰው መምራት | Leading People | 25 | 15 |
| 3 | ውጤት ተኮርነት | Results Focus | 20 | 15 |
| 4 | ማኔጅመንት ጥበብ | Management Wisdom | 10 | 15 |
| 5 | ትብብርና ቅንጅት | Collaboration | 10 | 14 |
| 6 | መሰረታዊ ብቃቶች | Core Competencies | 15 | 16 |
| **Total** | | | **100** | **100** |

## Table: `hr_comp_weight`

Individual competency definitions with per-category weights for each rater path.

```sql
CREATE TABLE hr_comp_weight (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(255),
    lookup_key       VARCHAR(255),
    weight_division  INT,
    weight_director  INT,
    cat_id           BIGINT,
    CONSTRAINT FK_cat FOREIGN KEY (cat_id) REFERENCES hr_comp_category(id)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `BIGINT` | PK, AUTO_INCREMENT | Competency ID |
| `name` | `VARCHAR` | | Amharic competency name |
| `lookup_key` | `VARCHAR` | | Machine key for matching ratings (underscore-separated) |
| `weight_division` | `INT` | | Points within category for Division raters |
| `weight_director` | `INT` | | Points within category for Director raters |
| `cat_id` | `BIGINT` | FK | Parent category |

### Seed Data by Category

**Cat 1 — ለውጥ መምራት (Div:20, Dir:25)**
| Competency | lookup_key | Div | Dir |
|-----------|-----------|-----|-----|
| የስራ ምህዳር ከባቢ ዕውቀት | የስራ_ምህዳር_ከባቢ_ዕውቀት | 5 | 8 |
| ፈጠራና ኢንኖቬሽን | ፈጠራና_ኢንኖቬሽን | 4 | 7 |
| ስትራቴጂያዊ ዕይታ | ስትራቴጂያዊ_ዕይታ | 5 | 5 |
| ተለዋዋጭነት | ተለዋዋጭነት | 3 | 3 |
| አይበገሬነት | አይበገሬነት | 2 | 2 |
| ራዕይ | ራዕይ | 1 | 0 |
| **Subtotal** | | **20** | **25** |

**Cat 2 — ሰው መምራት (Div:25, Dir:15)**
| Competency | lookup_key | Div | Dir |
|-----------|-----------|-----|-----|
| የተሰጥኦ አመራር | የተሰጥኦ_አመራር | 8 | 3 |
| ሰው መገንባት | ሰው_መገንባት | 8 | 7 |
| ቡድን መስራት | ቡድን_መስራት | 9 | 5 |
| **Subtotal** | | **25** | **15** |

**Cat 3 — ውጤት ተኮርነት (Div:20, Dir:15)**
| Competency | lookup_key | Div | Dir |
|-----------|-----------|-----|-----|
| ኃላፊነትና ተጠያቂነት | ኃላፊነትና_ተጠያቂነት | 3 | 3 |
| የደንበኛ አገልግሎትና እርካታ | የደንበኛ_አገልግሎትና_እርካታ | 3 | 3 |
| ውሳኔ ሰጭነት | ውሳኔ_ሰጭነት | 4 | 3 |
| የችግር አፈታት | የችግር_አፈታት | 4 | 3 |
| ኢንተርፕርነርሺፕ | ኢንተርፕርነርሺፕ | 3 | 1 |
| ሙያዊ ልቀት | ሙያዊ_ልቀት | 3 | 2 |
| **Subtotal** | | **20** | **15** |

**Cat 4 — ማኔጅመንት ጥበብ (Div:10, Dir:15)**
| Competency | lookup_key | Div | Dir |
|-----------|-----------|-----|-----|
| የፋይናንስ ሃብት ስራ አመራር | የፋይናንስ_ሃብት_ስራ_አመራር | 3 | 5 |
| የሰው ሃብት ስራ አመራር | የሰው_ሃብት_ስራ_አመራር | 4 | 5 |
| የቴክኖሎጂ ስራ አመራር | የቴክኖሎጂ_አመራር | 3 | 5 |
| **Subtotal** | | **10** | **15** |

**Cat 5 — ትብብርና ቅንጅት (Div:10, Dir:14)**
| Competency | lookup_key | Div | Dir |
|-----------|-----------|-----|-----|
| አጋርነት | አጋርነት | 5 | 7 |
| የመደራደርና ሃሳብን የማሳመን | የመደራደርና_ሃሳብን_የማሳመን | 5 | 7 |
| **Subtotal** | | **10** | **14** |

**Cat 6 — መሰረታዊ ብቃቶች (Div:15, Dir:16)**
| Competency | lookup_key | Div | Dir |
|-----------|-----------|-----|-----|
| በቀጣይነት መማርና ማደግ | በቀጣይነት_መማርና_ማደግ | 4 | 4 |
| ሰዋዊ መስተጋብር | ሰዋዊ_መስተጋብር | 4 | 4 |
| የንግግር ግንኙነት ብቃት | የንግግር_ግንኙነት_ብቃት | 4 | 4 |
| የፅሁፍ ግንኙነት | የፅሁፍ_ግንኙነት | 3 | 4 |
| **Subtotal** | | **15** | **16** |

**Grand Total:** Div = 20+25+20+10+10+15 = **100** ✓ | Dir = 25+15+15+15+14+16 = **100** ✓

## Table: `evaluation_headers`

Header record for each evaluation submission. Stores denormalized leader info and auto-computed metadata.

```sql
CREATE TABLE evaluation_headers (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    budget_year           VARCHAR(255),
    leadership_id         VARCHAR(255),
    full_name             VARCHAR(255),
    department_name       VARCHAR(255),
    job_title             VARCHAR(255),
    start_date            VARCHAR(255),
    end_date              VARCHAR(255),
    identity_integrity    VARCHAR(255),
    public_service        VARCHAR(255),
    filled_by             VARCHAR(255),
    rater_role            VARCHAR(255),
    total_score           DOUBLE,
    rater_dept_id         INT,
    rater_parent_dept_id  INT,
    rater_position_level  INT
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | `BIGINT` PK | Evaluation record ID |
| `budget_year` | `VARCHAR` | Ethiopian budget year (e.g. `"2017"`) |
| `leadership_id` | `VARCHAR` | Employee ID of the leader being evaluated |
| `full_name` | `VARCHAR` | Denormalized leader full name |
| `department_name` | `VARCHAR` | Denormalized leader department |
| `job_title` | `VARCHAR` | Denormalized leader job title |
| `start_date` | `VARCHAR` | Ethiopian date `"YYYY-MM-DD"` |
| `end_date` | `VARCHAR` | Ethiopian date `"YYYY-MM-DD"` |
| `identity_integrity` | `VARCHAR` | `"High"`, `"Medium"`, `"Low"` or NULL |
| `public_service` | `VARCHAR` | `"Excellent"`, `"Good"`, `"Satisfactory"` or NULL |
| `filled_by` | `VARCHAR` | Employee ID of the rater |
| `rater_role` | `VARCHAR` | `"SUPERVISOR"`, `"PEER"`, `"SUBORDINATE"`, `"SELF"`, `"OTHER"` |
| `total_score` | `DOUBLE` | Computed weighted total |
| `rater_dept_id` | `INT` | Rater's department (role classification) |
| `rater_parent_dept_id` | `INT` | Rater's parent dept (role classification) |
| `rater_position_level` | `INT` | Determines Division vs Director path |

### Repository Queries

```java
// Fetch all evaluations for a leader in a year
List<EvaluationHeader> findByLeadershipIdAndBudgetYear(String leadershipId, String budgetYear);

// Fetch evaluations by leader, year, and rater department
List<EvaluationHeader> findByLeadershipIdAndBudgetYearAndRaterDeptId(
        String leadershipId, String budgetYear, Integer raterDeptId);

// Peer detection query
@Query("SELECT e FROM EvaluationHeader e WHERE e.leadershipId = :leaderId " +
       "AND e.budgetYear = :year AND e.raterParentDeptId = :parentId " +
       "AND e.raterDeptId <> :myDeptId AND e.raterPositionLevel = 2")
List<EvaluationHeader> findPeersByHierarchy(...);
```

### Per-Evaluation Scoring

```java
double competencyWeight = isDirectorLevel
    ? item.getWeightDirector()    // position level ≤ 2
    : item.getWeightDivision();   // position level > 2

double competencyScore = (rating.getScore() / 5.0) * competencyWeight;
rating.setWeightedScore(competencyScore);
totalScore += competencyScore;
```

## Table: `evaluation_ratings`

Individual competency ratings within an evaluation. Cascade-deleted with parent header.

```sql
CREATE TABLE evaluation_ratings (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    competency_key  VARCHAR(255),
    score           INT,
    weighted_score  DOUBLE,
    header_id       BIGINT,
    CONSTRAINT FK_header FOREIGN KEY (header_id) REFERENCES evaluation_headers(id)
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | `BIGINT` PK | Rating record ID |
| `competency_key` | `VARCHAR` | Matches `hr_comp_weight.lookup_key` |
| `score` | `INT` | 1-5 scale (1=Weak, 5=Excellent) |
| `weighted_score` | `DOUBLE` | Computed: `(score / 5.0) × competencyWeight` |
| `header_id` | `BIGINT` FK | Parent evaluation (cascade delete) |

## Table: `system_config`

Configurable key-value pairs for role weights and qualitative bonus weights.

```sql
CREATE TABLE system_config (
    config_key   VARCHAR(255) PRIMARY KEY,
    config_value DOUBLE
);
```

| Column | Type | Description |
|--------|------|-------------|
| `config_key` | `VARCHAR(255)` PK | Configuration key |
| `config_value` | `DOUBLE` | Numeric value |

### Seed Data

| Key | Default | Description |
|-----|---------|-------------|
| `WEIGHT_SUPERVISOR` | `40.0` | Supervisor group weight (%) |
| `WEIGHT_PEER` | `20.0` | Peer group weight (%) |
| `WEIGHT_SUBORDINATE` | `30.0` | Subordinate group weight (%) |
| `WEIGHT_SELF` | `10.0` | Self-assessment weight (%) |
| `WEIGHT_INTEGRITY` | `0.0` | Integrity bonus (0 = disabled) |
| `WEIGHT_PUBLIC_SERVICE` | `0.0` | Public service bonus (0 = disabled) |

**Constraint:** `WEIGHT_SUPERVISOR + WEIGHT_PEER + WEIGHT_SUBORDINATE + WEIGHT_SELF = 100`

### Final Score Formula

```
Final Score = Σ(roleGroupContribution) + integrityBonus + publicServiceBonus
  where:
    roleGroupContribution = avg(group scores) × (roleWeight / 100)
    qualitative mapping: High/Excellent=100, Medium/Good=70, Low/Satisfactory=40
    qualitative contribution = mappedValue × (qualWeight / 100)
```

## Integrity Constraints

### Foreign Keys

| Child Table | Column | Parent Table | Delete |
|-------------|--------|-------------|--------|
| `departments` | `parent_id` | `departments.id` | RESTRICT |
| `employees` | `department_id` | `departments.id` | RESTRICT |
| `employees` | `position_id` | `positions.id` | RESTRICT |
| `employees` | `manager_id` | `employees.id` | RESTRICT |
| `hr_comp_weight` | `cat_id` | `hr_comp_category.id` | RESTRICT |
| `evaluation_ratings` | `header_id` | `evaluation_headers.id` | CASCADE |

### Unique Constraints

| Table | Column | Purpose |
|-------|--------|---------|
| `employees` | `keycloak_id` | One-to-one Keycloak user mapping |

### Business Constraints (Application-Level)

1. Role weights must sum to 100
2. Category division weights sum to 100
3. Category director weights sum to 100
4. Per-category competency division weights must match category weight
5. Per-category competency director weights must match category weight
6. Budget year must be Ethiopian (< 2024, between 2000-2099)
7. Score range: 1-5
8. Rater role: one of SUPERVISOR/PEER/SUBORDINATE/SELF/OTHER
9. Employee role: one of ROLE_HR_ADMIN/ROLE_MANAGEMENT/ROLE_MOYTEGNA

## Key Queries

### Evaluations by Role Group

```sql
SELECT rater_role, COUNT(*) AS count, AVG(total_score) AS avg_score
FROM evaluation_headers
WHERE leadership_id = 'MGMT-100' AND budget_year = '2017'
GROUP BY rater_role;
```

### Weighted Report Breakdown

```sql
SELECT rater_role, AVG(total_score) AS group_avg,
  CASE rater_role
    WHEN 'SUPERVISOR' THEN 40
    WHEN 'PEER' THEN 20
    WHEN 'SUBORDINATE' THEN 30
    WHEN 'SELF' THEN 10
  END AS role_weight
FROM evaluation_headers
WHERE leadership_id = 'MGMT-100' AND budget_year = '2017'
GROUP BY rater_role;
```

### Competency Detail with Names

```sql
SELECT eh.filled_by, er.competency_key, cw.name AS competency_name,
       cc.name AS category_name, er.score, er.weighted_score
FROM evaluation_headers eh
JOIN evaluation_ratings er ON er.header_id = eh.id
JOIN hr_comp_weight cw ON cw.lookup_key = er.competency_key
JOIN hr_comp_category cc ON cc.id = cw.cat_id
WHERE eh.leadership_id = 'MGMT-100' AND eh.budget_year = '2017';
```

### Subordinate Check

```sql
-- Direct subordinates
SELECT * FROM employees WHERE manager_id = 'MGMT-100';

-- Department subordinates (rater's parent dept = leader's dept)
SELECT e.* FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE d.parent_id = (SELECT department_id FROM employees WHERE id = 'MGMT-100');
```

### Weight Constraint Validation

```sql
-- Verify category totals
SELECT 'Division' AS path, SUM(weight_div) FROM hr_comp_category
UNION ALL
SELECT 'Director', SUM(weight_dir) FROM hr_comp_category;

-- Verify per-category competency weights match
SELECT cc.name, cc.weight_div AS expected_div,
  SUM(cw.weight_division) AS actual_div,
  CASE WHEN cc.weight_div = SUM(cw.weight_division) THEN 'OK' ELSE 'MISMATCH' END
FROM hr_comp_category cc
JOIN hr_comp_weight cw ON cw.cat_id = cc.id
GROUP BY cc.id;
```
