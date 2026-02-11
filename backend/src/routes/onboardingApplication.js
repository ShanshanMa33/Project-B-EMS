const router = require('express').Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const ctrl = require('../controllers/onboardingApplication');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for processing in controller
const { uploadOnboarding } = require('../middleware/uploadOnboarding');
const { getMyApplication, createOrUpdateMyApplication, updateMyOnboardingApplication,
    uploadOnboardingDoc, downloadOnboardingDoc, previewOnboardingDoc, deleteOnboardingDoc
} = require('../controllers/onboardingApplication');

// Handle multer upload errors for onboarding documents
const handleUploadOnboarding = (req, res, next) => {
    uploadOnboarding.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || 'Upload failed' });
        }
        return next();
    });
};

// Employee routes for onboarding application
router.get('/', authenticateToken, authorizeRoles('employee'), ctrl.getMyApplication);
router.post('/', authenticateToken, authorizeRoles('employee'), ctrl.createOrUpdateMyApplication);
// Allow PUT for updates as well
router.put('/', authenticateToken, authorizeRoles('employee'), ctrl.updateMyOnboardingApplication);

// Document upload/download routes
router.post('/documents', authenticateToken, authorizeRoles('employee'), handleUploadOnboarding, ctrl.uploadOnboardingDoc);
router.put('/documents', authenticateToken, authorizeRoles('employee'), handleUploadOnboarding, ctrl.uploadOnboardingDoc);
// Document download/preview routes
router.get('/documents/:docId', authenticateToken, authorizeRoles('employee'), ctrl.downloadOnboardingDoc);
router.get('/documents/:docId/preview', authenticateToken, authorizeRoles('employee'), ctrl.previewOnboardingDoc);
router.delete('/documents/:docId', authenticateToken, authorizeRoles('employee'), ctrl.deleteOnboardingDoc);

module.exports = router;