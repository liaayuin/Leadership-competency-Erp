package com.example.backend.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.backend.model.CompetencyCategory;
import com.example.backend.model.CompetencyLookup;
import com.example.backend.model.Department;
import com.example.backend.model.Employee;
import com.example.backend.model.Position;
import com.example.backend.model.SystemConfig;
import com.example.backend.repository.CompetencyCategoryRepository;
import com.example.backend.repository.CompetencyLookupRepository;
import com.example.backend.repository.DepartmentRepository;
import com.example.backend.repository.EmployeeRepository;
import com.example.backend.repository.PositionRepository;
import com.example.backend.repository.SystemConfigRepository;
import com.example.backend.service.KeycloakService;

@Configuration
public class DatabaseSeeder {

        @Bean
        CommandLineRunner initDatabase(
                        CompetencyCategoryRepository catRepo,
                        CompetencyLookupRepository itemRepo,
                        EmployeeRepository empRepo,
                        DepartmentRepository deptRepo,
                        PositionRepository posRepo,
                        SystemConfigRepository configRepo,
                        KeycloakService keycloakService) {

                return args -> {

                        // ── 0. SYSTEM CONFIG (role weights + qualitative weights) ────────────────
                        if (configRepo.count() == 0) {
                                configRepo.saveAll(List.of(
                                                // Report role-group weights — must sum to 100 for numeric path
                                                new SystemConfig("WEIGHT_SUPERVISOR", 40.0),
                                                new SystemConfig("WEIGHT_PEER", 20.0),
                                                new SystemConfig("WEIGHT_SUBORDINATE", 30.0),
                                                new SystemConfig("WEIGHT_SELF", 10.0),
                                                // Qualitative bonus weights — set to 0 by default (no numeric score)
                                                new SystemConfig("WEIGHT_INTEGRITY", 0.0),
                                                new SystemConfig("WEIGHT_PUBLIC_SERVICE", 0.0)));
                                System.out.println("✅ SystemConfig seeded.");
                        }

                        // 1. COMPETENCY CATEGORIES 
                        // weightDiv = points this category is worth for Division-level raters (all cats
                        // sum to 100)
                        // weightDir = points this category is worth for Director-level raters (all cats
                        // sum to 100)
                        if (catRepo.count() == 0) {
                                catRepo.saveAll(List.of(
                                                new CompetencyCategory(null, "ለውጥ መምራት", 20, 25),
                                                new CompetencyCategory(null, "ሰው መምራት", 25, 15),
                                                new CompetencyCategory(null, "ውጤት ተኮርነት", 20, 15),
                                                new CompetencyCategory(null, "ማኔጅመንት ጥበብ", 10, 15),
                                                new CompetencyCategory(null, "ትብብርና ቅንጅት", 10, 14),
                                                new CompetencyCategory(null, "መሰረታዊ ብቃቶች", 15, 16)));
                                // Note: Div path: 20+25+20+10+10+15=100 ✓
                                // Dir path: 25+15+15+15+14+16=100 ✓
                        }

                        //2. COMPETENCY LOOKUPS 
                        // weightDivision = this competency's points within the category for
                        // Division-level raters
                        // weightDirector = this competency's points within the category for
                        // Director-level raters
                        // All competency weightDivision values inside a category must sum to that
                        // category's weightDiv.
                        // All competency weightDirector values inside a category must sum to that
                        // category's weightDir.
                        if (itemRepo.count() == 0) {
                                List<CompetencyCategory> cats = catRepo.findAll();
                                Long cat1 = getId(cats, "ለውጥ መምራት");
                                Long cat2 = getId(cats, "ሰው መምራት");
                                Long cat3 = getId(cats, "ውጤት ተኮርነት");
                                Long cat4 = getId(cats, "ማኔጅመንት ጥበብ");
                                Long cat5 = getId(cats, "ትብብርና ቅንጅት");
                                Long cat6 = getId(cats, "መሰረታዊ ብቃቶች");

                                itemRepo.saveAll(List.of(
                                                // cat1 ለውጥ መምራት: Div sum=20, Dir sum=25
                                                new CompetencyLookup(null, "የስራ ምህዳር ከባቢ ዕውቀት", "የስራ_ምህዳር_ከባቢ_ዕውቀት", 5,
                                                                8, cat1),
                                                new CompetencyLookup(null, "ፈጠራና ኢንኖቬሽን", "ፈጠራና_ኢንኖቬሽን", 4, 7, cat1),
                                                new CompetencyLookup(null, "ስትራቴጂያዊ ዕይታ", "ስትራቴጂያዊ_ዕይታ", 5, 5, cat1),
                                                new CompetencyLookup(null, "ተለዋዋጭነት", "ተለዋዋጭነት", 3, 3, cat1),
                                                new CompetencyLookup(null, "አይበገሬነት", "አይበገሬነት", 2, 2, cat1),
                                                // Div: 5+4+5+3+2=19 → add 1 to last item ✓ Dir: 8+7+5+3+2=25 ✓
                                                new CompetencyLookup(null, "ራዕይ", "ራዕይ", 1, 0, cat1),
                                                // Div total: 20 ✓, Dir total: 25 ✓

                                                // cat2 ሰው መምራት: Div sum=25, Dir sum=15
                                                new CompetencyLookup(null, "የተሰጥኦ አመራር", "የተሰጥኦ_አመራር", 8, 3, cat2),
                                                new CompetencyLookup(null, "ሰው መገንባት", "ሰው_መገንባት", 8, 7, cat2),
                                                new CompetencyLookup(null, "ቡድን መስራት", "ቡድን_መስራት", 9, 5, cat2),
                                                // Div: 8+8+9=25  Dir: 3+7+5=15 

                                                // cat3 ውጤት ተኮርነት: Div sum=20, Dir sum=15
                                                new CompetencyLookup(null, "ኃላፊነትና ተጠያቂነት", "ኃላፊነትና_ተጠያቂነት", 3, 3,
                                                                cat3),
                                                new CompetencyLookup(null, "የደንበኛ አገልግሎትና እርካታ", "የደንበኛ_አገልግሎትና_እርካታ",
                                                                3, 3, cat3),
                                                new CompetencyLookup(null, "ውሳኔ ሰጭነት", "ውሳኔ_ሰጭነት", 4, 3, cat3),
                                                new CompetencyLookup(null, "የችግር አፈታት", "የችግር_አፈታት", 4, 3, cat3),
                                                new CompetencyLookup(null, "ኢንተርፕርነርሺፕ", "ኢንተርፕርነርሺፕ", 3, 1, cat3),
                                                new CompetencyLookup(null, "ሙያዊ ልቀት", "ሙያዊ_ልቀት", 3, 2, cat3),
                                                // Div: 3+3+4+4+3+3=20 ✓ Dir: 3+3+3+3+1+2=15 ✓

                                                // cat4 ማኔጅመንት ጥበብ: Div sum=10, Dir sum=15
                                                new CompetencyLookup(null, "የፋይናንስ ሃብት ስራ አመራር", "የፋይናንስ_ሃብት_ስራ_አመራር",
                                                                3, 5, cat4),
                                                new CompetencyLookup(null, "የሰው ሃብት ስራ አመራር", "የሰው_ሃብት_ስራ_አመራር", 4, 5,
                                                                cat4),
                                                new CompetencyLookup(null, "የቴክኖሎጂ ስራ አመራር", "የቴክኖሎጂ_አመራር", 3, 5, cat4),
                                                // Div: 3+4+3=10 ✓ Dir: 5+5+5=15 ✓

                                                // cat5 ትብብርና ቅንጅት: Div sum=10, Dir sum=14
                                                new CompetencyLookup(null, "አጋርነት", "አጋርነት", 5, 7, cat5),
                                                new CompetencyLookup(null, "የመደራደርና ሃሳብን የማሳመን", "የመደራደርና_ሃሳብን_የማሳመን",
                                                                5, 7, cat5),
                                                // Div: 5+5=10 ✓ Dir: 7+7=14 ✓

                                                // cat6 መሰረታዊ ብቃቶች: Div sum=15, Dir sum=16
                                                new CompetencyLookup(null, "በቀጣይነት መማርና ማደግ", "በቀጣይነት_መማርና_ማደግ", 4, 4,
                                                                cat6),
                                                new CompetencyLookup(null, "ሰዋዊ መስተጋብር", "ሰዋዊ_መስተጋብር", 4, 4, cat6),
                                                new CompetencyLookup(null, "የንግግር ግንኙነት ብቃት", "የንግግር_ግንኙነት_ብቃት", 4, 4,
                                                                cat6),
                                                new CompetencyLookup(null, "የፅሁፍ ግንኙነት", "የፅሁፍ_ግንኙነት", 3, 4, cat6)
                                // Div: 4+4+4+3=15 ✓ Dir: 4+4+4+4=16 ✓
                                ));
                        }

                        // 3. DEPARTMENTS 
                        if (deptRepo.count() == 0) {
                                Department hq = deptRepo.save(new Department(1, "የኢንስቲትዩቱ ዋና ዳይሬክተር ጽህፈት ቤት", null));
                                Department digitalWing = deptRepo.save(new Department(2, "የዲጂታላይዜሽን ዘርፍ", hq));
                                Department financeWing = deptRepo.save(new Department(3, "የፋይናንስና አስተዳደር ዘርፍ", hq));
                                Department hrAdmin = deptRepo.save(new Department(4, "የሰው ሃብት ዋና ቡድን", hq));
                                Department softwareDiv = deptRepo
                                                .save(new Department(5, "የሶፍትዌር ልማት ቡድን", digitalWing));
                                Department hrDiv = deptRepo.save(new Department(7, "የሰው ሃብት ስራ አመራር ቡድን", digitalWing));
                                deptRepo.save(new Department(8, "የባክኤንድ ልማት ክፍል", softwareDiv));
                                deptRepo.save(new Department(9, "የፍሮንትኤንድ ልማት ክፍል", softwareDiv));
                        }

                        // 4. POSITIONS 
                        if (posRepo.count() == 0) {
                                posRepo.save(new Position(1, "ዋና ዳይሬክተር", 1));
                                posRepo.save(new Position(2, "ዳይሬክተር", 2));
                                posRepo.save(new Position(3, "የቡድን መሪ", 3));
                                posRepo.save(new Position(4, "ከፍተኛ ባለሙያ", 4));
                                posRepo.save(new Position(5, "ባለሙያ", 5));
                        }

                        //  5. EMPLOYEES 
                        if (empRepo.count() == 0) {
                                Department digitalWing = deptRepo.findById(2).get();
                                Department softwareDiv = deptRepo.findById(5).get();
                                Department hrDiv = deptRepo.findById(7).get();
                                Department backendSec = deptRepo.findById(8).get();
                                Department frontendSec = deptRepo.findById(9).get();
                                Department hrAdminDept = deptRepo.findById(4).get();

                                Position pDirector = posRepo.findById(2).get();
                                Position pLeader = posRepo.findById(3).get();
                                Position pSenior = posRepo.findById(4).get();
                                Position pJunior = posRepo.findById(5).get();

                                // 5a. HR Admin (ROLE_HR_ADMIN)
                                String hrAdminId = "hr-002";
                                Employee hrAdminEmp = empRepo.save(new Employee(
                                                hrAdminId, "ሰሎሞን", "ጌታቸው", "ደሳለኝ",
                                                hrAdminDept, pDirector, null, "ROLE_HR_ADMIN"));
                                String hrAdminKcId = keycloakService.createKeycloakUser(
                                                hrAdminId, "ሰሎሞን", "ጌታቸው", "ROLE_HR_ADMIN");
                                if (hrAdminKcId != null) {
                                        hrAdminEmp.setKeycloakId(hrAdminKcId);
                                        empRepo.save(hrAdminEmp);
                                }

                                // 5b. Director / Supervisor (ROLE_MANAGEMENT)
                                String dirId = "mgmt-director-01";
                                Employee director = empRepo.save(new Employee(
                                                dirId, "ፋሲል", "በቀለ", "አየለ",
                                                digitalWing, pDirector, null, "ROLE_MANAGEMENT"));
                                String dirKcId = keycloakService.createKeycloakUser(
                                                dirId, "ፋሲል", "በቀለ", "ROLE_MANAGEMENT");
                                if (dirKcId != null) {
                                        director.setKeycloakId(dirKcId);
                                        empRepo.save(director);
                                }

                                // 5c. Managers (ROLE_MANAGEMENT)
                                List<Employee> managers = new ArrayList<>();
                                String[] mFirst = { "አረጋ", "ጥበቡ", "ለመለመ", "ዮናስ", "መላኩ", "ግርማ", "ፀጋዬ", "ፋሲል", "በርሄ",
                                                "ኤልያስ" };
                                String[] mMiddle = { "ተመስገን", "ጌጡ", "ታሪኩ", "ዘነበ", "አዲሱ", "መኮንን", "ኃይሉ", "በየነ", "አስፋው",
                                                "ኪሮስ" };
                                String[] mLast = { "አየለ", "መኮንን", "ተፈራ", "ግርማይ", "ተክሉ", "በየነ", "አክሊሉ", "ደስታ", "ገብሬ",
                                                "ወልዴ" };

                                for (int i = 0; i < 10; i++) {
                                        String mgmtId = (i == 0) ? "MGMT-100" : (i == 2) ? "ID-1001" : "MGMT-10" + i;
                                        Department dept = (i == 0) ? softwareDiv : hrDiv;
                                        Employee m = empRepo.save(new Employee(
                                                        mgmtId, mFirst[i], mMiddle[i], mLast[i],
                                                        dept, pLeader, director, "ROLE_MANAGEMENT"));
                                        String mKcId = keycloakService.createKeycloakUser(
                                                        mgmtId, mFirst[i], mMiddle[i], "ROLE_MANAGEMENT");
                                        if (mKcId != null) {
                                                m.setKeycloakId(mKcId);
                                                empRepo.save(m);
                                        }
                                        managers.add(m);
                                }

                                // 5d. Subordinates (ROLE_MOYTEGNA — normal employees)
                                String[] fNames = { "አበበ", "ለማ", "ታደሰ", "ግርማ", "ካሳ", "ዘላለም", "ዳዊት", "ኤፍሬም", "ቴዎድሮስ",
                                                "በረከት" };

                                for (int i = 0; i < 60; i++) {
                                        Department assignTo = (i < 20) ? backendSec
                                                        : (i < 40) ? frontendSec : softwareDiv;
                                        String empId = "EMP-" + String.format("%03d", i + 1);
                                        Employee supervisor = managers.get(i / 6);
                                        Employee emp = empRepo.save(new Employee(
                                                        empId, fNames[i % 10], "በቀለ", "ወርቁ",
                                                        assignTo, (i % 5 == 0) ? pSenior : pJunior,
                                                        supervisor, "ROLE_MOYTEGNA"));
                                        String empKcId = keycloakService.createKeycloakUser(
                                                        empId, fNames[i % 10], "በቀለ", "ROLE_MOYTEGNA");
                                        if (empKcId != null) {
                                                emp.setKeycloakId(empKcId);
                                                empRepo.save(emp);
                                        }
                                }

                                System.out.println("✅ Database seeded: all employees have Keycloak UUIDs stored.");
                        }
                };
        }

        private Long getId(List<CompetencyCategory> cats, String name) {
                return cats.stream().filter(c -> c.getName().equals(name)).findFirst()
                                .orElseThrow(() -> new RuntimeException("Category not found: " + name)).getId();
        }
}
