const User = require('../models/users');
const RegistrationToken = require('../models/RegistrationToken');
const { signToken } = require('../middleware/auth');

// User sign-in controller
async function signIn(req, res) {
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

// Register employee account with invitation token
async function registerWithToken(req, res) {
    try {
        const { token, username, password } = req.body;

        if (!token || !username || !password) {
            return res.status(400).json({ message: 'Token, username, and password are required' });
        }

        const invitation = await RegistrationToken.findOne({ token, status: 'unused' });
        if (!invitation) {
            return res.status(400).json({ message: 'Invalid or expired invitation token' });
        }

        const existingEmail = await User.findOne({ email: invitation.email });
        if (existingEmail) {
            return res.status(409).json({ message: 'This email has already been registered' });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({ message: 'Username is already taken' });
        }

        const user = await User.create({
            username,
            email: invitation.email,
            password,
            role: 'employee',
        });

        invitation.status = 'used';
        await invitation.save();

        return res.status(201).json({
            message: 'Registration completed',
            user: { id: user._id, username: user.username, email: user.email, role: user.role },
        });
    } catch (error) {
        return res.status(500).json({ message: 'Registration failed', error: error.message });
    }
}

module.exports = {
    signIn,
    me,
    registerWithToken,
};
