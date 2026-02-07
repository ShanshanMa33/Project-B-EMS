const router = require('express').Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { getOnboardingApplication, createOnboardingApplication, updateOnboardingApplication
} = require('../controllers/onboardingApplication');

router.get('/onboarding', authenticateToken, authorizeRoles('employee', 'hr'), getOnboardingApplication);
router.post('/onboarding', authenticateToken, authorizeRoles('employee'), createOnboardingApplication);
router.put('/onboarding/:id', authenticateToken, authorizeRoles('employee', 'hr'), updateOnboardingApplication);

module.exports = router;