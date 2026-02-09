const router = require('express').Router();
const { login, me } = require('../controllers/auth');
const { authenticateToken } = require('../middleware/auth');

// User login route
router.post('/login', login);

// Get current authenticated user
router.get('/me', authenticateToken, me);

module.exports = router;