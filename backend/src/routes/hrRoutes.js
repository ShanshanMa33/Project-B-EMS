const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');


router.use(authenticateToken, authorizeRoles('hr'));

// 1. Hiring
router.post('/invitation', hr.sendInvitation);
router.get('/invitation-history', hr.getInvitationHistory);

// 2. Onboarding Review
router.get('/onboarding/pending', hr.getPendingApplication);
router.put('/onboarding/review', hr.reviewApplication);

// 3. Employee Profiles
router.get('/profiles', hr.getAllEmployees);

// 4. Visa Management
router.get('/visa/all', hr.getAllVisaStatus);
router.put('/visa/review', hr.reviewVisaFile);
router.post('/visa/notify', hr.sendVisaNotification);

module.exports = router;