const User = require('../models/users');
const { signToken } = require('../middleware/auth');

// User login controller
async function login(req, res) {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    // Check if user exists
    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await user.comparePassword(password);
    // Check if password matches
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = signToken(user);
    // Return token and user info
    return res.json({
        token,
        user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
}

// Get current authenticated user
async function me(req, res) {
    return res.json({ user: req.user });
}

module.exports = {
    login,
    me,
};