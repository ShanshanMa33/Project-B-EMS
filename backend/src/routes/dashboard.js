const router = require('express').Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { requireApprovedOnboarding } = require('../middleware/workflowGuards');

router.get('/', authenticateToken, (req, res) => {
    res.json({
        message: `Welcome to the dashboard, ${req.user.username}!`,
        user: { id: req.user._id, username: req.user.username, role: req.user.role }
    })
});

// HR-only dashboard
router.get('/hr', authenticateToken, authorizeRoles('hr'), (req, res) => {
    res.json({
        dashboard: 'hr',
        message: 'Welcome HR!'
    })
});

// Employee-only dashboard
router.get('/employee', authenticateToken, authorizeRoles('employee'), requireApprovedOnboarding, (req, res) => {
    res.json({
        dashboard: 'employee',
        message: 'Welcome Employee!'
    })
});

module.exports = router;
