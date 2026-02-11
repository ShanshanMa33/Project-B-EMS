const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');


router.use(authenticateToken, authorizeRoles('hr'));

// 1. Hiring
router.post('/invitation', hrController.sendInvitation);
router.get('/invitation-history', hrController.getInvitationHistory);

// 2. Onboarding Review
router.get('/onboarding/pending', hrController.getPendingApplication);
router.get('/onboarding/all', hrController.getAllApplications);
router.get('/onboarding/:userId', hrController.getApplicationDetail);
router.put('/onboarding/review', hrController.reviewApplication);

// 3. Employee Profiles
router.get('/profiles', hrController.getAllEmployees);
router.get('/documents/:userId/:docKey/preview', hrController.previewEmployeeDocument);
router.get('/documents/:userId/:docKey/download', hrController.downloadEmployeeDocument);
router.get('/visa-documents/:userId/:docId/preview', hrController.previewVisaCaseDocument);
router.get('/visa-documents/:userId/:docId/download', hrController.downloadVisaCaseDocument);

// 4. Visa Management
router.get('/visa/all', hrController.getAllVisaStatus);
router.put('/visa/review', hrController.reviewVisaFile);
router.post('/visa/notify', hrController.sendVisaNotification);

module.exports = router;
