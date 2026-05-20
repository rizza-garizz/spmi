const express = require("express");
const catchAsync = require("../utils/catchAsync");
const validate = require("../middlewares/validate");
const { verifyToken, optionalAuth } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
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
const ROLE_ALL_ACTIVE = ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"];
const ROLE_NILAI = ["admin_lpm", "auditor", "kaprodi", "sekprodi", "unit_kerja"];
const ROLE_DOCUMENT_WRITE = ["admin_lpm", "kaprodi", "sekprodi", "unit_kerja"];
const ROLE_PPEPP_WRITE = ["admin_lpm", "kaprodi", "sekprodi", "unit_kerja"];
const ROLE_AMI_READ = ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"];
const ROLE_AMI_WRITE = ["admin_lpm", "auditor"];
const ROLE_RTM_READ = ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"];
const ROLE_RTM_WRITE = ["admin_lpm", "dekan", "wakil_dekan"];
const ROLE_RTL_WRITE = ["admin_lpm", "kaprodi", "sekprodi", "unit_kerja"];
const ROLE_INDICATOR_WRITE = ["admin_lpm", "kaprodi", "sekprodi", "unit_kerja"];
const ROLE_ORG_READ = ["admin_lpm", "dekan", "wakil_dekan"];
const ROLE_SURVEY_READ = ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"];
const ROLE_ADMIN_ONLY = ["admin_lpm"];

router.get("/health", healthController.health);
router.get("/system/status", catchAsync(systemController.status));

router.get("/catalog", optionalAuth, compatController.catalog);
router.get("/dashboard/summary", optionalAuth, compatController.dashboardSummary);
router.get("/standards", optionalAuth, compatController.standards);
router.post("/standards", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.createStandard);
router.get("/standards/:id/revisions", optionalAuth, compatController.standardRevisions);
router.put("/standards/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.updateStandardRecord);
router.delete("/standards/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.deleteStandardRecord);
router.get("/documents", optionalAuth, compatController.documents);
router.post("/documents", verifyToken, requireRole(...ROLE_DOCUMENT_WRITE), upload.single("file"), compatController.createDocument);
router.get("/documents/versions/:versionId", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.documentVersion);
router.get("/ppepp/cycles", optionalAuth, compatController.ppeppCycles);
router.post("/ppepp/cycles", verifyToken, requireRole(...ROLE_PPEPP_WRITE), compatController.createPpeppCycle);
router.patch("/ppepp/cycles/:id/stages/:stage", verifyToken, requireRole(...ROLE_PPEPP_WRITE), compatController.updatePpeppCycleStage);
router.post(
  "/ppepp/cycles/:id/stages/:stage/evidence",
  verifyToken,
  requireRole(...ROLE_PPEPP_WRITE),
  upload.single("file"),
  compatController.uploadPpeppEvidence
);
router.get("/ami/audits", optionalAuth, compatController.amiAudits);
router.post("/ami/audits", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.createAmiAudit);
router.post("/ami/audits/:id/findings", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.createFinding);
router.get("/rtm/meetings", optionalAuth, compatController.rtmMeetings);
router.post("/rtm/meetings", verifyToken, requireRole(...ROLE_RTM_WRITE), compatController.createMeeting);
router.patch(
  "/rtm/meetings/:meetingId/actions/:actionId",
  verifyToken,
  requireRole(...ROLE_RTL_WRITE),
  compatController.updateMeetingActionProgress
);
router.get("/indicators", optionalAuth, compatController.indicators);
router.post("/indicators", verifyToken, requireRole(...ROLE_INDICATOR_WRITE), compatController.createIndicator);
router.post("/indicators/:id/values", verifyToken, requireRole(...ROLE_INDICATOR_WRITE), compatController.createIndicatorValue);
router.patch("/governance/:entity/:id/approval", verifyToken, requireRole(...ROLE_ALL_ACTIVE), compatController.updateApproval);
router.get("/org-units", optionalAuth, compatController.orgUnits);
router.get("/integrations", optionalAuth, compatController.integrations);
router.get("/hris", optionalAuth, compatController.hris);
router.get("/hris/employees", optionalAuth, compatController.hrisEmployees);
router.get("/hris/employees/:id", optionalAuth, compatController.hrisEmployeeProfile);
router.post("/hris/employees", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.createHrisEmployee);
router.put("/hris/employees/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.updateHrisEmployeeRecord);
router.delete("/hris/employees/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.deleteHrisEmployeeRecord);
router.get("/hris/positions", optionalAuth, compatController.hrisPositions);
router.post("/hris/positions", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.createHrisPosition);
router.put("/hris/positions/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.updateHrisPositionRecord);
router.delete("/hris/positions/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.deleteHrisPositionRecord);
router.get("/hris/competencies", optionalAuth, compatController.hrisCompetencies);
router.post("/hris/competencies", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.createHrisCompetency);
router.put("/hris/competencies/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.updateHrisCompetencyRecord);
router.delete("/hris/competencies/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.deleteHrisCompetencyRecord);
router.get("/hris/documents", optionalAuth, compatController.hrisDocuments);
router.post("/hris/documents", verifyToken, requireRole(...ROLE_ADMIN_ONLY), upload.single("file"), compatController.createHrisDocument);
router.put("/hris/documents/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), upload.single("file"), compatController.updateHrisDocumentRecord);
router.delete("/hris/documents/:id", verifyToken, requireRole(...ROLE_ADMIN_ONLY), compatController.deleteHrisDocumentRecord);
router.get("/imports", optionalAuth, compatController.imports);
router.post("/imports", verifyToken, requireRole(...ROLE_ADMIN_ONLY), upload.single("file"), compatController.createImport);
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
router.get("/surveys", optionalAuth, compatController.surveys);
router.post("/surveys", verifyToken, requireRole(...ROLE_AMI_WRITE), compatController.createSurvey);

router.post("/auth/login", validate(loginSchema), catchAsync(authController.login));
router.get("/auth/me", verifyToken, catchAsync(authController.me));
router.post("/auth/logout", verifyToken, catchAsync(authController.logout));

router.get("/standar", optionalAuth, catchAsync(standarController.index));
router.post(
  "/standar",
  verifyToken,
  requireRole(...ROLE_ADMIN_ONLY),
  validate(standardSchema),
  catchAsync(standarController.store)
);
router.put(
  "/standar/:id",
  verifyToken,
  requireRole(...ROLE_ADMIN_ONLY),
  validate(standardSchema),
  catchAsync(standarController.update)
);
router.delete(
  "/standar/:id",
  verifyToken,
  requireRole(...ROLE_ADMIN_ONLY),
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
