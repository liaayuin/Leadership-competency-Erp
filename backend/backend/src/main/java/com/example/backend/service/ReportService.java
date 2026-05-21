package com.example.backend.service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.Dto.EvaluationReportDTO;
import com.example.backend.model.Employee;
import com.example.backend.model.EvaluationHeader;
import com.example.backend.repository.EmployeeRepository;
import com.example.backend.repository.EvaluationRepository;
import com.example.backend.repository.SystemConfigRepository;

@Service
public class ReportService {

        private static final Logger log = LoggerFactory.getLogger(ReportService.class);
        private final EvaluationRepository repository;
        private final EmployeeRepository employeeRepository;
        private final SystemConfigRepository configRepository;

        public ReportService(EvaluationRepository repository,
                        EmployeeRepository employeeRepository,
                        SystemConfigRepository configRepository) {
                this.repository = repository;
                this.employeeRepository = employeeRepository;
                this.configRepository = configRepository;
        }

        private String normalizeEthYear(String raw) {
                if (raw == null || raw.isBlank()) {
                        throw new IllegalArgumentException("Year parameter is missing or blank.");
                }
                String trimmed = raw.trim();
                int year;
                try {
                        year = Integer.parseInt(trimmed);
                } catch (NumberFormatException e) {
                        throw new IllegalArgumentException("Year is not a valid integer: '" + raw + "'");
                }

                if (year >= 2024) {
                        throw new IllegalArgumentException(
                                        "Year '" + year + "' looks like a Gregorian year. "
                                                        + "The system stores budgetYear in the Ethiopian calendar (e.g. 2017, 2018). "
                                                        + "Please send the Ethiopian year.");
                }
                if (year < 2000 || year > 2099) {
                        throw new IllegalArgumentException(
                                        "Year '" + year + "' is outside the expected Ethiopian calendar range (2000–2099).");
                }
                return String.valueOf(year);
        }

        @Transactional(readOnly = true)
        public EvaluationReportDTO getSummaryUnrestricted(String targetId, String year) {
                String ethYear = normalizeEthYear(year);
                Employee target = employeeRepository.findById(targetId)
                                .orElseThrow(() -> new RuntimeException("Employee not found: " + targetId));
                log.info("getSummaryUnrestricted: targetId={} ethYear={}", targetId, ethYear);
                return buildDto(target, ethYear);
        }

        @Transactional(readOnly = true)
        public EvaluationReportDTO getSummary(String targetId, String year, String requesterId) {
                if (requesterId == null || requesterId.isBlank()) {
                        throw new RuntimeException("Access Denied: Requester ID missing.");
                }
                String ethYear = normalizeEthYear(year);
                Employee target = employeeRepository.findById(targetId)
                                .orElseThrow(() -> new RuntimeException("Employee not found: " + targetId));
                log.info("getSummary: requesterId={} targetId={} ethYear={}", requesterId, targetId, ethYear);
                return buildDto(target, ethYear);
        }

        @Transactional(readOnly = true)
        public boolean checkIfSubordinate(String requesterId, String targetId) {
                if (requesterId.equalsIgnoreCase(targetId))
                        return false;
                Employee target = employeeRepository.findById(targetId).orElse(null);
                Employee requester = employeeRepository.findById(requesterId).orElse(null);
                if (target == null || requester == null)
                        return false;

                boolean isDirectManager = target.getManager() != null
                                && target.getManager().getId().equalsIgnoreCase(requesterId);

                Integer targetParentDeptId = (target.getDepartment() != null
                                && target.getDepartment().getParentDepartment() != null)
                                                ? target.getDepartment().getParentDepartment().getId()
                                                : null;
                Integer requesterDeptId = requester.getDepartment() != null
                                ? requester.getDepartment().getId()
                                : null;

                boolean isDeptSupervisor = targetParentDeptId != null
                                && targetParentDeptId.equals(requesterDeptId);

                log.info("checkIfSubordinate: requester={} target={} directMgr={} deptSup={}",
                                requesterId, targetId, isDirectManager, isDeptSupervisor);
                return isDirectManager || isDeptSupervisor;
        }

        private EvaluationReportDTO buildDto(Employee target, String ethYear) {
                Integer targetParentDeptId = (target.getDepartment() != null
                                && target.getDepartment().getParentDepartment() != null)
                                                ? target.getDepartment().getParentDepartment().getId()
                                                : null;

                // Role-weighting percentages (from SystemConfig, editable in Admin panel)
                int wSup = fetchWeight("WEIGHT_SUPERVISOR", 40);
                int wPeer = fetchWeight("WEIGHT_PEER", 20);
                int wSub = fetchWeight("WEIGHT_SUBORDINATE", 30);
                int wSelf = fetchWeight("WEIGHT_SELF", 10);

                // Qualitative bonus weights (default 0)
                int wIntegrity = fetchWeight("WEIGHT_INTEGRITY", 0);
                int wPublicService = fetchWeight("WEIGHT_PUBLIC_SERVICE", 0);

                String targetPosTitle = target.getPosition() != null ? target.getPosition().getTitle() : "";

                List<EvaluationHeader> allRecords = repository.findByLeadershipIdAndBudgetYear(target.getId(), ethYear);

                log.info("buildDto: target={} ethYear={} totalRecordsFound={}",
                                target.getId(), ethYear, allRecords.size());

                allRecords.forEach(r -> {
                        if (!ethYear.equals(r.getBudgetYear() == null ? null : r.getBudgetYear().trim())) {
                                log.warn("Record id={} has budgetYear='{}' which differs from queried year='{}'",
                                                r.getId(), r.getBudgetYear(), ethYear);
                        }
                });

                EvaluationReportDTO dto = new EvaluationReportDTO();
                dto.setFullName(target.getFirstName() + " "
                                + (target.getMiddleName() != null ? target.getMiddleName() + " " : "")
                                + target.getLastName());
                dto.setDepartmentName(target.getDepartment() != null ? target.getDepartment().getName() : "N/A");
                dto.setJobTitle(targetPosTitle);
                dto.setWeightSupervisor(wSup);
                dto.setWeightPeer(wPeer);
                dto.setWeightSubordinate(wSub);
                dto.setWeightSelf(wSelf);
                dto.setWeightIntegrity(wIntegrity);
                dto.setWeightPublicService(wPublicService);

                filterAndSetRecords(dto, allRecords, target, targetParentDeptId, targetPosTitle,
                                wSup, wPeer, wSub, wSelf, wIntegrity, wPublicService);
                dto.calculateTotalFinalScore();
                return dto;
        }

        private void filterAndSetRecords(EvaluationReportDTO dto, List<EvaluationHeader> allRecords,
                        Employee target, Integer targetParentDeptId, String targetPosTitle,
                        int wSup, int wPeer, int wSub, int wSelf, int wIntegrity, int wPublicService) {

                String targetId = target.getId();
                Integer targetDeptId = target.getDepartment() != null ? target.getDepartment().getId() : null;

                // SUPERVISOR: rater's dept == target's parent dept
                List<EvaluationHeader> supRecords = allRecords.stream()
                                .filter(r -> targetParentDeptId != null
                                                && targetParentDeptId.equals(r.getRaterDeptId()))
                                .collect(Collectors.toList());

                // SUBORDINATE: rater's dept's parent == target's dept
                List<EvaluationHeader> subRecords = allRecords.stream()
                                .filter(r -> {
                                        if (r.getFilledBy() == null)
                                                return false;
                                        Employee rater = employeeRepository.findById(r.getFilledBy()).orElse(null);
                                        return rater != null
                                                        && rater.getDepartment() != null
                                                        && rater.getDepartment().getParentDepartment() != null
                                                        && Objects.equals(
                                                                        rater.getDepartment().getParentDepartment()
                                                                                        .getId(),
                                                                        targetDeptId);
                                }).collect(Collectors.toList());

                // PEER: same parent dept as target, different child dept, same position title
                List<EvaluationHeader> peerRecords = allRecords.stream()
                                .filter(r -> {
                                        if (r.getFilledBy() == null || r.getFilledBy().equalsIgnoreCase(targetId))
                                                return false;
                                        Employee rater = employeeRepository.findById(r.getFilledBy()).orElse(null);
                                        if (rater == null || rater.getDepartment() == null
                                                        || targetParentDeptId == null)
                                                return false;
                                        Integer raterParentId = rater.getDepartment().getParentDepartment() != null
                                                        ? rater.getDepartment().getParentDepartment().getId()
                                                        : null;
                                        String raterPos = rater.getPosition() != null ? rater.getPosition().getTitle()
                                                        : "";
                                        return Objects.equals(raterParentId, targetParentDeptId)
                                                        && !Objects.equals(rater.getDepartment().getId(), targetDeptId)
                                                        && Objects.equals(raterPos, targetPosTitle);
                                }).collect(Collectors.toList());

                // SELF
                List<EvaluationHeader> selfRecords = allRecords.stream()
                                .filter(r -> r.getFilledBy() != null
                                                && r.getFilledBy().equalsIgnoreCase(targetId))
                                .collect(Collectors.toList());

                log.info("filterAndSetRecords: sup={} peer={} sub={} self={}",
                                supRecords.size(), peerRecords.size(), subRecords.size(), selfRecords.size());

                dto.setSupervisorRecords(supRecords);
                dto.setPeerRecords(peerRecords);
                dto.setSubordinateRecords(subRecords);
                dto.setSelfRecords(selfRecords);

                dto.setSupervisorWeightedScore(calculateGroupScore(supRecords, wSup));
                dto.setPeerWeightedScore(calculateGroupScore(peerRecords, wPeer));
                dto.setSubordinateWeightedScore(calculateGroupScore(subRecords, wSub));
                dto.setSelfWeightedScore(calculateGroupScore(selfRecords, wSelf));
                dto.setIntegrityScore(calculateQualitativeScore(allRecords, "identityIntegrity", wIntegrity));
                dto.setPublicServiceScore(calculateQualitativeScore(allRecords, "publicService", wPublicService));
        }

        private double calculateGroupScore(List<EvaluationHeader> records, int roleWeight) {
                if (records == null || records.isEmpty())
                        return 0.0;
                double avg = records.stream()
                                .filter(r -> r.getTotalScore() != null)
                                .mapToDouble(EvaluationHeader::getTotalScore)
                                .average().orElse(0.0);
                return avg * (roleWeight / 100.0);
        }

        /**
         * Qualitative score: maps High/Excellent → 100, Medium/Good → 70,
         * Low/Satisfactory → 40, then applies the configured weight fraction.
         */
        private double calculateQualitativeScore(List<EvaluationHeader> records, String field, int weight) {
                if (weight <= 0 || records == null || records.isEmpty())
                        return 0.0;
                double avg = records.stream()
                                .mapToDouble(r -> {
                                        String val = "identityIntegrity".equals(field)
                                                        ? r.getIdentityIntegrity()
                                                        : r.getPublicService();
                                        if (val == null)
                                                return 0.0;
                                        return switch (val) {
                                                case "High", "Excellent" -> 100.0;
                                                case "Medium", "Good" -> 70.0;
                                                case "Low", "Satisfactory" -> 40.0;
                                                default -> 0.0;
                                        };
                                }).average().orElse(0.0);
                return avg * (weight / 100.0);
        }

        private int fetchWeight(String key, int defaultValue) {
                return configRepository.findById(key)
                                .map(c -> c.getConfigValue() != null ? c.getConfigValue().intValue() : defaultValue)
                                .orElse(defaultValue);
        }
}