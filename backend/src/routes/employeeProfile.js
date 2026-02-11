const router = require('express').Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { getEmployeeProfile, updateEmployeeProfile } = require('../controllers/employeeProfile');

router.get('/profile', authenticateToken, authorizeRoles('employee', 'hr'), getEmployeeProfile);
router.put('/profile', authenticateToken, authorizeRoles('employee', 'hr'), updateEmployeeProfile);

module.exports = router;