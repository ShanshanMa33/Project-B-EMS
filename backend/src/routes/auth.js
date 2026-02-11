const router = require('express').Router();
const { signIn, me, registerWithToken } = require('../controllers/auth');
const { authenticateToken } = require('../middleware/auth');

// User login route
router.post('/signin', signIn);
router.post('/register-with-token', registerWithToken);

// Get current authenticated user
router.get('/me', authenticateToken, me);

module.exports = router;
