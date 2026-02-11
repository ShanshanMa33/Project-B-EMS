const router = require('express').Router();
const { signIn, me } = require('../controllers/auth');
const { authenticateToken } = require('../middleware/auth');

// User sign-in route
router.post('/signin', signIn);
router.post('/login', signIn); // Alias for sign-in

// Get current authenticated user
router.get('/me', authenticateToken, me);

module.exports = router;