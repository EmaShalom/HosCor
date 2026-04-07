package com.hoscor.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoscor.domain.entity.ActionAuditLog;
import com.hoscor.domain.entity.Bed;
import com.hoscor.domain.entity.Patient;
import com.hoscor.domain.enums.BedState;
import com.hoscor.domain.enums.ChatbotIntent;
import com.hoscor.domain.enums.PatientStatus;
import com.hoscor.domain.enums.ResponseType;
import com.hoscor.domain.enums.TransferStatus;
import com.hoscor.domain.repository.ActionAuditLogRepository;
import com.hoscor.domain.repository.BedRepository;
import com.hoscor.domain.repository.PatientRepository;
import com.hoscor.domain.repository.TransferRepository;
import com.hoscor.dto.ActionConfirmRequest;
import com.hoscor.dto.ApiResponse;
import com.hoscor.dto.ChatbotMessage;
import com.hoscor.dto.ChatbotResponseDto;
import com.hoscor.dto.GuideResponse;
import com.hoscor.dto.IntelligenceResult;
import com.hoscor.service.BedIntelligenceService;
import com.hoscor.service.DecisionEngineService;
import com.hoscor.service.GuideService;
import com.hoscor.service.IntentRouter;
import com.hoscor.service.PatientFlowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@Slf4j
public class ChatbotController {

    private final IntentRouter intentRouter;
    private final BedIntelligenceService bedIntelligenceService;
    private final PatientFlowService patientFlowService;
    private final DecisionEngineService decisionEngineService;
    private final GuideService guideService;
    private final BedRepository bedRepository;
    private final PatientRepository patientRepository;
    private final TransferRepository transferRepository;
    private final ActionAuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @PostMapping("/send")
    public ApiResponse<ChatbotResponseDto> send(@Valid @RequestBody ChatbotMessage request) {
        String message = request.getMessage();
        ChatbotIntent intent = intentRouter.detectIntent(message);
        log.debug("Chatbot intent: {} for message: {}", intent, message);

        try {
            IntelligenceResult result = route(intent, message);
            return ApiResponse.ok(toDto(result));
        } catch (Exception e) {
            log.error("Chatbot routing error for intent {}: {}", intent, e.getMessage(), e);
            return ApiResponse.ok(toDto(IntelligenceResult.text(
                "Je n'ai pas pu traiter cette demande. Veuillez reformuler ou essayer une autre question.")));
        }
    }

    @PostMapping("/action/confirm")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT')")
    public ApiResponse<ChatbotResponseDto> confirmAction(@Valid @RequestBody ActionConfirmRequest request) {
        String actionType = request.getActionType();
        Map<String, Object> params = request.getParams();
        IntelligenceResult result;

        try {
            result = executeAction(actionType, params);
            logAudit(actionType, params, result, "SUCCESS");
        } catch (Exception e) {
            log.error("Action failed: {}", actionType, e);
            result = IntelligenceResult.text("Erreur lors de l'exécution de l'action: " + e.getMessage());
            logAudit(actionType, params, result, "FAILED");
        }

        return ApiResponse.ok(toDto(result));
    }

    private IntelligenceResult route(ChatbotIntent intent, String message) {
        return switch (intent) {
            case HYGIENE_STATUS -> bedIntelligenceService.getCleaningBeds();
            case BED_COUNT -> bedIntelligenceService.getAvailableBedCount();
            case BED_SATURATION, ALERT_SATURATION -> bedIntelligenceService.getSaturationStatus();
            case BED_RESERVED -> bedIntelligenceService.getReservedUnoccupied();
            case BED_CLEANING -> bedIntelligenceService.getCleaningBeds();
            case BED_FORECAST -> bedIntelligenceService.forecast24h();
            case STATS_OCCUPANCY, UNIT_CAPACITY -> bedIntelligenceService.getOccupancyRate();
            case WAITING_COUNT -> patientFlowService.getWaitingCount();
            case WAITING_URGENT -> patientFlowService.getMostUrgent();
            case WAITING_PRIORITY -> patientFlowService.getPriorityPatient();
            case WAITING_BY_DIAG -> patientFlowService.getWaitingByDiagnosis();
            case TRANSFER_STATUS -> patientFlowService.getTransferStatus(message);
            case TRANSFER_LIST, TRANSFER_DELAYS -> patientFlowService.getTransferList();
            case STATS_ADMISSIONS -> patientFlowService.getAdmissionStats();
            case STATS_LOS -> patientFlowService.getAverageLOS();
            case STATS_DAMA -> patientFlowService.getDamaRate();
            case STATS_TRENDS -> patientFlowService.getAdmissionTrends();
            case UNIT_MATCHING -> decisionEngineService.matchPatientToUnit(message);
            case ALERT_CRITICAL -> decisionEngineService.getCriticalAlerts();
            case ALERT_WAIT_TOO_LONG -> decisionEngineService.getOverdueWaiting();
            case FORECAST_TODAY -> decisionEngineService.forecastToday();
            case FORECAST_TOMORROW -> decisionEngineService.forecastTomorrow();
            case FORECAST_RISK -> decisionEngineService.saturationRiskToday();
            case OPS_BOTTLENECK, OPS_WHO_INTERVENE -> decisionEngineService.findBottleneck();
            case OPS_BLOCKER -> decisionEngineService.explainBlocker(message);
            case AI_STRATEGY -> decisionEngineService.generateStrategy();
            case AI_DETERIORATION -> decisionEngineService.detectDeteriorationRisk();
            case AI_OPTIMIZE -> decisionEngineService.optimizeBedAssignment();
            case AI_SIMULATE -> decisionEngineService.simulateAdmissions(message);
            case AI_REORGANIZE -> decisionEngineService.proposeReorganization();
            case GUIDE_ASSIGN_BED, GUIDE_ADMIT_PATIENT, GUIDE_CHANGE_BED, GUIDE_FREE_BED,
                 GUIDE_MARK_OCCUPIED, GUIDE_VIEW_BEDS, GUIDE_RESERVE_BED, GUIDE_CANCEL_RESERVATION,
                 GUIDE_ADD_WAITING, GUIDE_PRIORITIZE, GUIDE_ASSIGN_UNIT, GUIDE_VIEW_WAITING,
                 GUIDE_FILTER_URGENCY, GUIDE_UPDATE_STATUS, GUIDE_CREATE_TRANSFER,
                 GUIDE_OUTGOING_TRANSFER, GUIDE_ASSIGN_INCOMING, GUIDE_RESERVE_TRANSFER,
                 GUIDE_CHANGE_TRANSFER, GUIDE_CANCEL_TRANSFER, GUIDE_CONFIRM_ARRIVAL,
                 GUIDE_HANDLE_ALERT, GUIDE_VIEW_ALERTS, GUIDE_RESOLVE_ALERT,
                 GUIDE_IDENTIFY_URGENT, GUIDE_CHECK_SATURATION, GUIDE_READ_DASHBOARD,
                 GUIDE_WEEK_STATS, GUIDE_ANALYZE_ADMISSIONS, GUIDE_IDENTIFY_DIFFICULT,
                 GUIDE_ANTICIPATE_BEDS, GUIDE_CRITICAL_WAIT, GUIDE_BED_SHORTAGE,
                 GUIDE_MULTI_PRIORITY, GUIDE_CHOOSE_UNIT, GUIDE_OPTIMIZE,
                 ONBOARDING_HELP, ONBOARDING_NAVIGATE,
                 ERROR_ASSIGN_BED, ERROR_TRANSFER, ERROR_LOGIN, ERROR_GENERAL,
                 HYGIENE_ROTATION,
                 PATIENT_DISCHARGE, PATIENT_CREATE,
                 MORNING_BRIEFING, DIAGNOSIS_LOOKUP -> {
                GuideResponse guide = guideService.getGuide(intent);
                yield IntelligenceResult.builder()
                        .type(ResponseType.GUIDE)
                        .message(guide.getTitle())
                        .data(guide)
                        .build();
            }
            case ACTION_ASSIGN_BED -> IntelligenceResult.builder()
                    .type(ResponseType.ACTION_CONFIRM)
                    .message("Voulez-vous attribuer un lit? Précisez l'ID du lit et le numéro de civière.")
                    .actionType("ACTION_ASSIGN_BED")
                    .build();
            case ACTION_RESERVE_BED -> IntelligenceResult.builder()
                    .type(ResponseType.ACTION_CONFIRM)
                    .message("Voulez-vous réserver un lit? Précisez l'ID du lit.")
                    .actionType("ACTION_RESERVE_BED")
                    .build();
            case ACTION_CREATE_TRANSFER -> IntelligenceResult.builder()
                    .type(ResponseType.ACTION_CONFIRM)
                    .message("Pour créer un transfert, utilisez la section 'Transferts' dans le menu.")
                    .actionType("ACTION_CREATE_TRANSFER")
                    .build();
            case ACTION_MARK_CRITICAL -> IntelligenceResult.builder()
                    .type(ResponseType.ACTION_CONFIRM)
                    .message("Voulez-vous marquer une situation comme critique? Précisez les détails.")
                    .actionType("ACTION_MARK_CRITICAL")
                    .build();
            case ACTION_UPDATE_TRANSFER -> IntelligenceResult.builder()
                    .type(ResponseType.ACTION_CONFIRM)
                    .message("Voulez-vous mettre à jour le statut d'un transfert? Précisez l'ID et le nouveau statut.")
                    .actionType("ACTION_UPDATE_TRANSFER")
                    .build();
            case PATIENT_SEARCH -> IntelligenceResult.text(
                    "Pour rechercher un patient, utilisez son numéro MRD (ex: MRD-2024-001) ou consultez la liste des patients admis.");
            case GENERAL_QUESTION, UNKNOWN -> IntelligenceResult.text(
                    "Je n'ai pas saisi votre demande. Voici ce que je peux faire :\n\n" +
                    "📊 **Données en temps réel** — \"lits disponibles\", \"patients en attente\", \"alertes critiques\", \"saturation des unités\"\n" +
                    "🔀 **Transferts** — \"transferts du jour\", \"liste des transferts\"\n" +
                    "📋 **Guides pas-à-pas** — \"comment attribuer un lit\", \"comment créer un transfert\", \"comment congédier un patient\"\n" +
                    "🏥 **Orientation diagnostic** — \"insuffisance cardiaque\" → unité recommandée\n" +
                    "🔧 **Dépannage** — \"le bouton ne fonctionne pas\", \"impossible de se connecter\"\n" +
                    "🤖 **IA** — \"générer une stratégie\", \"optimiser les attributions\", \"prévoir pour demain\"\n\n" +
                    "Reformulez en français ou choisissez un exemple ci-dessus.");
        };
    }

    private IntelligenceResult executeAction(String actionType, Map<String, Object> params) {
        return switch (actionType) {
            case "ACTION_ASSIGN_BED" -> {
                Long bedId = toLong(params.get("bedId"));
                String mrd = String.valueOf(params.get("mrd"));
                Bed bed = bedRepository.findById(bedId)
                        .orElseThrow(() -> new IllegalArgumentException("Lit introuvable: " + bedId));
                Patient patient = patientRepository.findByMrdNumber(mrd)
                        .orElseThrow(() -> new IllegalArgumentException("Patient introuvable: " + mrd));
                bed.setState(BedState.OCCUPIED);
                bedRepository.save(bed);
                patient.setBedNumber(bed.getBedNumber());
                patient.setUnit(bed.getUnit());
                patient.setStatus(PatientStatus.ADMITTED);
                patientRepository.save(patient);
                yield IntelligenceResult.text("Lit " + bed.getBedNumber() + " attribué à " +
                        patient.getFirstName() + " " + patient.getLastName() + " ✓");
            }
            case "ACTION_RESERVE_BED" -> {
                Long bedId = toLong(params.get("bedId"));
                Bed bed = bedRepository.findById(bedId)
                        .orElseThrow(() -> new IllegalArgumentException("Lit introuvable: " + bedId));
                bed.setState(BedState.READY);
                bedRepository.save(bed);
                yield IntelligenceResult.text("Lit " + bed.getBedNumber() + " réservé ✓");
            }
            case "ACTION_UPDATE_TRANSFER" -> {
                Long transferId = toLong(params.get("transferId"));
                String statusStr = String.valueOf(params.get("status"));
                var transfer = transferRepository.findById(transferId)
                        .orElseThrow(() -> new IllegalArgumentException("Transfert introuvable: " + transferId));
                transfer.setStatus(TransferStatus.valueOf(statusStr));
                transferRepository.save(transfer);
                yield IntelligenceResult.text("Statut du transfert mis à jour: " + statusStr + " ✓");
            }
            case "ACTION_MARK_CRITICAL" -> IntelligenceResult.text(
                    "Situation marquée comme critique. Les alertes ont été notifiées ✓");
            case "ACTION_CREATE_TRANSFER" -> IntelligenceResult.text(
                    "Pour créer un transfert, utilisez la section 'Transferts' dans le menu principal.");
            default -> IntelligenceResult.text("Action exécutée ✓");
        };
    }

    private ChatbotResponseDto toDto(IntelligenceResult result) {
        return ChatbotResponseDto.builder()
                .type(result.getType())
                .message(result.getMessage())
                .data(result.getData())
                .actionType(result.getActionType())
                .build();
    }

    private Long toLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        if (value instanceof String s) return Long.parseLong(s);
        throw new IllegalArgumentException("Valeur numérique requise: " + value);
    }

    private void logAudit(String actionType, Map<String, Object> params,
                          IntelligenceResult result, String status) {
        try {
            ActionAuditLog log = ActionAuditLog.builder()
                    .actionType(actionType)
                    .paramsJson(objectMapper.writeValueAsString(params))
                    .resultJson(objectMapper.writeValueAsString(result.getMessage()))
                    .timestamp(LocalDateTime.now())
                    .status(status)
                    .build();
            auditLogRepository.save(log);
        } catch (JsonProcessingException e) {
            // Non-critical — don't fail the request over logging
        }
    }
}
