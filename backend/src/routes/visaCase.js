const router = require('express').Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const visaCaseController = require('../controllers/visaCase');

router.get('/me', authenticateToken, authorizeRoles('employee'), visaCaseController.getMyVisaCases);
router.post('/me/documents', authenticateToken, authorizeRoles('employee'), upload.single('file'), visaCaseController.uploadVisaDocuments);
router.get('/me/documents/:docId/preview', authenticateToken, authorizeRoles('employee'), visaCaseController.previewVisaDocument);
router.get('/me/documents/:docId/download', authenticateToken, authorizeRoles('employee'), visaCaseController.downloadVisaDocument);
module.exports = router;