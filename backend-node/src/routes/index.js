const express = require("express");
const catchAsync = require("../utils/catchAsync");
const validate = require("../middlewares/validate");
const { verifyToken } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { authRateLimit } = require("../middlewares/rateLimit");
const { upload } = require("../utils/fileStorage");
const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const standarController = require("../controllers/standarController");
const dokumenController = require("../controllers/dokumenController");
const ppeppController = require("../controllers/ppeppController");
const amiController = require("../controllers/amiController");
const rtmController = require("../controllers/rtmController");
const surveiController = require("../controllers/surveiController");
const importController = require("../controllers/importController");
const migrationController = require("../controllers/migrationController");
const integrasiController = require("../controllers/integrasiController");
const settingsController = require("../controllers/settingsController");
const notificationController = require("../controllers/notificationController");
const orgUnitController = require("../controllers/orgUnitController");
const healthController = require("../controllers/healthController");
const systemController = require("../controllers/systemController");
const compatController = require("../controllers/compatController");
const {
  loginSchema,
  standardSchema,
  documentSchema,
  ppeppSchema,
  amiSchema,
  findingSchema,
  rtmSchema,
  surveySchema,
  surveyAnswerSchema,
  settingSchema,
  integrationSyncSchema,
} = require("../validators");

const router = express.Router();
const ROLE_SUPER_ADMIN = ["super_admin", "admin_lpm"];
const ROLE_LPM_ADMIN = ["super_admin", "lpm", "admin_lpm"];
const ROLE_ALL_ACTIVE = ["super_admin", "lpm", "admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja", "operator"];
const ROLE_NILAI = ["super_admin", "lpm", "admin_lpm", "auditor", "kaprodi", "sekprodi", "unit_kerja", "operator"];
const ROLE_DOCUMENT_WRITE = ["super_admin", "lpm", "admin_lpm", "kaprodi", "sekprodi", "unit_kerja", "operator"];
const ROLE_PPEPP_WRITE = ["super_admin", "lpm", "admin_lpm", "kaprodi", "sekprodi", "unit_kerja", "operator"];
const ROLE_AMI_READ = ["super_admin", "lpm", "admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"];
const ROLE_AMI_WRITE = ["super_admin", "lpm", "admin_lpm", "auditor"];
const ROLE_RTM_READ = ["super_admin", "lpm", "admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"];
const ROLE_RTM_WRITE = ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"];
const ROLE_RTL_WRITE = ["super_admin", "lpm", "admin_lpm", "kaprodi", "sekprodi", "unit_kerja", "operator"];
const ROLE_INDICATOR_WRITE = ["super_admin", "lpm", "admin_lpm", "kaprodi", "sekprodi", "unit_kerja", "operator"];
const ROLE_ORG_READ = ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"];
const ROLE_SURVEY_READ = ["super_admin", "lpm", "admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"];
const ROLE_ADMIN_ONLY = ROLE_SUPER_ADMIN;
const ROLE_HRIS_ADMIN = ["super_admin", "admin_lpm", "dekan", "wakil_dekan"];
const ROLE_ACCREDITATION_READ = ["super_admin", "lpm", "admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"];
const ROLE_ACCREDITATION_WRITE = ["super_admin", "lpm", "admin_lpm", "kaprodi", "sekprodi", "operator"];
const ROLE_ACCREDITATION_REVIEW = ["super_admin", "lpm", "admin_lpm", "auditor", "dekan", "wakil_dekan"];

router.get("/health", healthController.health);
router.get("/health/live", healthController.live);
router.get("/health/ready", catchAsync(healthController.ready));
router.get("/system/status", catchAsync(systemController.status));

router.get("/catalog", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.catalog);
router.get("/dashboard/summary", verifyToken, requireRole(...ROLE_ALL_ACTIVE), catchAsync(dashboardController.summary));
router.get("/dashboard/export", verifyToken, requireRole(...ROLE_ALL_ACTIVE), catchAsync(dashboardController.exportDashboard));
router.get("/performance/report", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.performanceReport);
router.get("/sync/map", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.dataSyncMap);
router.get("/standards", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.standards);
router.post("/standards", verifyToken, requireRole(...ROLE_LPM_ADMIN), compatController.createStandard);
router.get("/standards/:id/revisions", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.standardRevisions);
router.put("/standards/:id", verifyToken, requireRole(...ROLE_LPM_ADMIN), compatController.updateStandardRecord);
router.delete("/standards/:id", verifyToken, requireRole(...ROLE_LPM_ADMIN), compatController.deleteStandardRecord);
router.get("/documents", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.documents);
router.post("/documents", verifyToken, requireRole(...ROLE_DOCUMENT_WRITE), upload.single("file"), compatController.createDocument);
router.put("/documents/:id", verifyToken, requireRole(...ROLE_DOCUMENT_WRITE), compatController.updateDocumentRecord);
router.delete("/documents/:id", verifyToken, requireRole(...ROLE_DOCUMENT_WRITE), compatController.deleteDocumentRecord);
router.post("/documents/:id/versions", verifyToken, requireRole(...ROLE_DOCUMENT_WRITE), upload.single("file"), compatController.createDocumentVersion);
router.get("/documents/versions/:versionId", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.documentVersion);
router.get("/documents/versions/:versionId/download", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.documentVersionDownload);
router.get("/documents/versions/:versionId/preview", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.documentVersionPreview);
router.get("/ppepp/cycles", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.ppeppCycles);
router.post("/ppepp/cycles", verifyToken, requireRole(...ROLE_PPEPP_WRITE), compatController.createPpeppCycle);
router.put("/ppepp/cycles/:id", verifyToken, requireRole(...ROLE_PPEPP_WRITE), compatController.updatePpeppCycleRecord);
router.delete("/ppepp/cycles/:id", verifyToken, requireRole(...ROLE_PPEPP_WRITE), compatController.deletePpeppCycleRecord);
router.patch("/ppepp/cycles/:id/stages/:stage", verifyToken, requireRole(...ROLE_PPEPP_WRITE), compatController.updatePpeppCycleStage);
router.post(
  "/ppepp/cycles/:id/stages/:stage/evidence",
  verifyToken,
  requireRole(...ROLE_PPEPP_WRITE),
  upload.single("file"),
  compatController.uploadPpeppEvidence
);
router.get("/ami/audits", verifyToken, requireRole(...ROLE_AMI_READ), compatController.amiAudits);
router.post("/ami/audits", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.createAmiAudit);
router.put("/ami/audits/:id", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.updateAmiAuditRecord);
router.delete("/ami/audits/:id", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.deleteAmiAuditRecord);
router.get("/ami/audits/:id/summary", verifyToken, requireRole(...ROLE_AMI_READ), compatController.amiAuditSummary);
router.get("/ami/audits/:id/report", verifyToken, requireRole(...ROLE_AMI_READ), compatController.amiAuditReport);
router.patch("/ami/audits/:id/assignment", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.updateAmiAuditAssignment);
router.patch("/ami/audits/:id/instruments/:instrumentId", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.updateAmiAuditInstrument);
router.post("/ami/audits/:id/findings", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.createFinding);
router.patch("/ami/audits/:id/findings/:findingId/follow-up", verifyToken, requireRole(...ROLE_RTL_WRITE), compatController.updateAmiFindingFollowUpRecord);
router.patch("/ami/audits/:id/findings/:findingId/verification", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.verifyAmiFindingRecord);
router.get("/rtm/meetings", verifyToken, requireRole(...ROLE_RTM_READ), compatController.rtmMeetings);
router.post("/rtm/meetings", verifyToken, requireRole(...ROLE_RTM_WRITE), compatController.createMeeting);
router.put("/rtm/meetings/:id", verifyToken, requireRole(...ROLE_RTM_WRITE), compatController.updateMeetingRecord);
router.delete("/rtm/meetings/:id", verifyToken, requireRole(...ROLE_RTM_WRITE), compatController.deleteMeetingRecord);
router.patch(
  "/rtm/meetings/:meetingId/actions/:actionId",
  verifyToken,
  requireRole(...ROLE_RTL_WRITE),
  compatController.updateMeetingActionProgress
);
router.get("/indicators", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.indicators);
router.post("/indicators", verifyToken, requireRole(...ROLE_INDICATOR_WRITE), compatController.createIndicator);
router.put("/indicators/:id", verifyToken, requireRole(...ROLE_INDICATOR_WRITE), compatController.updateIndicatorRecord);
router.delete("/indicators/:id", verifyToken, requireRole(...ROLE_INDICATOR_WRITE), compatController.deleteIndicatorRecord);
router.post("/indicators/:id/values", verifyToken, requireRole(...ROLE_INDICATOR_WRITE), compatController.createIndicatorValue);
router.patch("/governance/:entity/:id/approval", verifyToken, requireRole(...ROLE_ALL_ACTIVE), catchAsync(compatController.updateApproval));
router.get("/org-units", verifyToken, requireRole(...ROLE_ALL_ACTIVE), catchAsync(orgUnitController.index));
router.post("/org-units", verifyToken, requireRole(...ROLE_ADMIN_ONLY), catchAsync(orgUnitController.store));
router.put("/org-units/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), catchAsync(orgUnitController.update));
router.delete("/org-units/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), catchAsync(orgUnitController.destroy));
router.get("/integrations/siakad/check", verifyToken, requireRole(...ROLE_ADMIN_ONLY), catchAsync(orgUnitController.siakadCheck));
router.get("/integrations/siakad/org-units/batches", verifyToken, requireRole(...ROLE_ADMIN_ONLY), catchAsync(orgUnitController.siakadBatches));
router.post("/integrations/siakad/org-units/preview", verifyToken, requireRole(...ROLE_ADMIN_ONLY), catchAsync(orgUnitController.siakadPreview));
router.post("/integrations/siakad/org-units/commit", verifyToken, requireRole(...ROLE_ADMIN_ONLY), catchAsync(orgUnitController.siakadCommit));
router.get("/integrations", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.integrations);
router.get("/integrations/readiness", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.integrationReadiness);
router.get("/integrations/logs", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.integrationLogs);
router.post("/integrations/:key/check", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.integrationCheck);
router.post("/integrations/:key/sync", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.integrationSync);
router.get("/security/audit-trail", verifyToken, requireRole(...ROLE_ADMIN_ONLY), catchAsync(compatController.auditTrail));
router.get("/notifications", verifyToken, requireRole(...ROLE_ALL_ACTIVE), catchAsync(notificationController.index));
router.get("/hris", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.hris);
router.get("/hris/employees", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.hrisEmployees);
router.get("/hris/employees/:id", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.hrisEmployeeProfile);
router.post("/hris/employees", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.createHrisEmployee);
router.put("/hris/employees/:id", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.updateHrisEmployeeRecord);
router.delete("/hris/employees/:id", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.deleteHrisEmployeeRecord);
router.get("/hris/positions", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.hrisPositions);
router.post("/hris/positions", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.createHrisPosition);
router.put("/hris/positions/:id", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.updateHrisPositionRecord);
router.delete("/hris/positions/:id", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.deleteHrisPositionRecord);
router.get("/hris/competencies", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.hrisCompetencies);
router.post("/hris/competencies", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.createHrisCompetency);
router.put("/hris/competencies/:id", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.updateHrisCompetencyRecord);
router.delete("/hris/competencies/:id", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.deleteHrisCompetencyRecord);
router.get("/hris/documents", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.hrisDocuments);
router.post("/hris/documents", verifyToken, requireRole(...ROLE_HRIS_ADMIN), upload.single("file"), compatController.createHrisDocument);
router.put("/hris/documents/:id", verifyToken, requireRole(...ROLE_HRIS_ADMIN), upload.single("file"), compatController.updateHrisDocumentRecord);
router.delete("/hris/documents/:id", verifyToken, requireRole(...ROLE_HRIS_ADMIN), compatController.deleteHrisDocumentRecord);
router.get("/accreditation/summary", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationSummary);
router.get("/accreditation/periods", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationPeriods);
router.post("/accreditation/periods", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.createAccreditationPeriod);
router.get("/accreditation/instruments", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationInstruments);
router.post("/accreditation/instruments", verifyToken, requireRole(...ROLE_LPM_ADMIN), compatController.createAccreditationInstrument);
router.get("/accreditation/criteria", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationCriteria);
router.post("/accreditation/criteria", verifyToken, requireRole(...ROLE_LPM_ADMIN), compatController.createAccreditationCriterion);
router.get("/accreditation/assessments", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationAssessments);
router.post("/accreditation/assessments", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.createAccreditationAssessment);
router.get("/accreditation/team-members", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationTeamMembers);
router.post("/accreditation/team-members", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.createAccreditationTeamMember);
router.get("/accreditation/tasks", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationTasks);
router.post("/accreditation/tasks", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.createAccreditationTask);
router.get("/accreditation/milestones", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationMilestones);
router.post("/accreditation/milestones", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.createAccreditationMilestone);
router.get("/accreditation/risks", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationRisks);
router.post("/accreditation/risks", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.createAccreditationRisk);
router.patch("/accreditation/risks/:id", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.updateAccreditationRiskRecord);
router.get("/accreditation/evidence", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationEvidence);
router.post("/accreditation/evidence", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), upload.single("file"), compatController.createAccreditationEvidence);
router.get("/accreditation/lkps", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationLkps);
router.post("/accreditation/lkps/entries", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.createAccreditationLkpsEntry);
router.get("/accreditation/led", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationLed);
router.post("/accreditation/led/contents", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.createAccreditationLedContent);
router.get("/accreditation/self-scores", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationSelfScores);
router.post("/accreditation/self-scores", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.createAccreditationSelfScore);
router.get("/accreditation/action-plans", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationActionPlans);
router.post("/accreditation/action-plans", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.createAccreditationActionPlan);
router.post("/accreditation/action-plans/bulk", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.createAccreditationActionPlansBulk);
router.patch("/accreditation/action-plans/:id", verifyToken, requireRole(...ROLE_ACCREDITATION_WRITE), compatController.updateAccreditationActionPlanRecord);
router.get("/accreditation/reviews", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationReviews);
router.post("/accreditation/reviews", verifyToken, requireRole(...ROLE_ACCREDITATION_REVIEW), compatController.createAccreditationReview);
router.get("/accreditation/submission-checks", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationSubmissionChecks);
router.post("/accreditation/submission-checks", verifyToken, requireRole(...ROLE_ACCREDITATION_REVIEW), compatController.createAccreditationSubmissionCheck);
router.post("/accreditation/submission-checks/bulk", verifyToken, requireRole(...ROLE_ACCREDITATION_REVIEW), compatController.createAccreditationSubmissionChecksBulk);
router.patch("/accreditation/submission-checks/:id", verifyToken, requireRole(...ROLE_ACCREDITATION_REVIEW), compatController.updateAccreditationSubmissionCheckRecord);
router.patch("/accreditation/periods/:id/status", verifyToken, requireRole(...ROLE_ACCREDITATION_REVIEW), compatController.updateAccreditationPeriodStatusRecord);
router.get("/accreditation/exports", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.accreditationExports);
router.post("/accreditation/exports", verifyToken, requireRole(...ROLE_ACCREDITATION_REVIEW), compatController.createAccreditationExport);
router.get("/accreditation/exports/:id/download", verifyToken, requireRole(...ROLE_ACCREDITATION_READ), compatController.downloadAccreditationExport);
router.get("/imports", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.imports);
router.post("/imports", verifyToken, requireRole(...ROLE_ADMIN_ONLY), upload.single("file"), compatController.createImport);
router.delete("/imports/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.deleteImportRecord);
router.post(
  "/imports/aoa/preview",
  verifyToken,
  requireRole(...ROLE_ADMIN_ONLY),
  upload.single("file"),
  catchAsync(migrationController.previewAoa)
);
router.post(
  "/imports/aoa/commit",
  verifyToken,
  requireRole(...ROLE_ADMIN_ONLY),
  upload.single("file"),
  catchAsync(migrationController.commitAoa)
);
router.get("/surveys", verifyToken, requireRole(...ROLE_SURVEY_READ), compatController.surveys);
router.post("/surveys", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.createSurvey);
router.put("/surveys/:id", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.updateSurveyRecord);
router.delete("/surveys/:id", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.deleteSurveyRecord);

router.post("/auth/login", authRateLimit, validate(loginSchema), catchAsync(authController.login));
router.get("/auth/me", verifyToken, catchAsync(authController.me));
router.post("/auth/logout", verifyToken, catchAsync(authController.logout));

router.get("/standar", verifyToken, requireRole(...ROLE_ALL_ACTIVE), catchAsync(standarController.index));
router.post(
  "/standar",
  verifyToken,
  requireRole(...ROLE_LPM_ADMIN),
  validate(standardSchema),
  catchAsync(standarController.store)
);
router.put(
  "/standar/:id",
  verifyToken,
  requireRole(...ROLE_LPM_ADMIN),
  validate(standardSchema),
  catchAsync(standarController.update)
);
router.delete(
  "/standar/:id",
  verifyToken,
  requireRole(...ROLE_LPM_ADMIN),
  catchAsync(standarController.destroy)
);

router.get(
  "/dokumen",
  verifyToken,
  requireRole(...ROLE_ALL_ACTIVE),
  catchAsync(dokumenController.index)
);
router.post(
  "/dokumen",
  verifyToken,
  requireRole(...ROLE_DOCUMENT_WRITE),
  upload.single("file"),
  validate(documentSchema),
  catchAsync(dokumenController.store)
);
router.get(
  "/dokumen/:id/download",
  verifyToken,
  requireRole(...ROLE_ALL_ACTIVE),
  catchAsync(dokumenController.download)
);

router.get(
  "/ppepp",
  verifyToken,
  requireRole(...ROLE_ALL_ACTIVE),
  catchAsync(ppeppController.index)
);
router.post(
  "/ppepp",
  verifyToken,
  requireRole(...ROLE_PPEPP_WRITE),
  validate(ppeppSchema),
  catchAsync(ppeppController.store)
);
router.put(
  "/ppepp/:id",
  verifyToken,
  requireRole(...ROLE_PPEPP_WRITE),
  validate(ppeppSchema),
  catchAsync(ppeppController.update)
);

router.get(
  "/ami",
  verifyToken,
  requireRole(...ROLE_AMI_READ),
  catchAsync(amiController.index)
);
router.post(
  "/ami",
  verifyToken,
  requireRole(...ROLE_AMI_WRITE),
  validate(amiSchema),
  catchAsync(amiController.store)
);
router.put(
  "/ami/:id",
  verifyToken,
  requireRole(...ROLE_AMI_WRITE),
  validate(amiSchema),
  catchAsync(amiController.update)
);
router.post(
  "/ami/:id/temuan",
  verifyToken,
  requireRole(...ROLE_AMI_WRITE),
  validate(findingSchema),
  catchAsync(amiController.addFinding)
);
router.get(
  "/ami/:id/temuan",
  verifyToken,
  requireRole(...ROLE_AMI_READ),
  catchAsync(amiController.getFindings)
);

router.get(
  "/rtm",
  verifyToken,
  requireRole(...ROLE_RTM_READ),
  catchAsync(rtmController.index)
);
router.post(
  "/rtm",
  verifyToken,
  requireRole(...ROLE_RTM_WRITE),
  validate(rtmSchema),
  catchAsync(rtmController.store)
);
router.put(
  "/rtm/:id",
  verifyToken,
  requireRole(...ROLE_RTM_WRITE),
  validate(rtmSchema),
  catchAsync(rtmController.update)
);

router.get(
  "/survei",
  verifyToken,
  requireRole(...ROLE_SURVEY_READ),
  catchAsync(surveiController.index)
);
router.post(
  "/survei",
  verifyToken,
  requireRole(...ROLE_AMI_WRITE),
  validate(surveySchema),
  catchAsync(surveiController.store)
);
router.post(
  "/survei/:id/jawaban",
  validate(surveyAnswerSchema),
  catchAsync(surveiController.answer)
);
router.get(
  "/survei/:id/hasil",
  verifyToken,
  requireRole(...ROLE_SURVEY_READ),
  catchAsync(surveiController.result)
);

router.post(
  "/import/standar",
  verifyToken,
  requireRole(...ROLE_ADMIN_ONLY),
  upload.single("file"),
  catchAsync(importController.importStandar)
);
router.post(
  "/import/dokumen",
  verifyToken,
  requireRole(...ROLE_ADMIN_ONLY),
  upload.array("files", 20),
  catchAsync(importController.importDokumen)
);

router.get(
  "/integrasi/status",
  verifyToken,
  requireRole(...ROLE_ADMIN_ONLY),
  catchAsync(integrasiController.status)
);
router.post(
  "/integrasi/sync",
  verifyToken,
  requireRole(...ROLE_ADMIN_ONLY),
  validate(integrationSyncSchema),
  catchAsync(integrasiController.sync)
);

router.get(
  "/settings",
  verifyToken,
  requireRole(...ROLE_ADMIN_ONLY),
  catchAsync(settingsController.getSettings)
);
router.put(
  "/settings",
  verifyToken,
  requireRole(...ROLE_ADMIN_ONLY),
  validate(settingSchema),
  catchAsync(settingsController.updateSettings)
);

module.exports = router;
