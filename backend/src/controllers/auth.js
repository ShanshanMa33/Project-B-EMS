const User = require('../models/users');
const RegistrationToken = require('../models/RegistrationToken');
const OnboardingApplication = require('../models/onboardingApplication');
const { signToken } = require('../middleware/auth');
const {
    normalizeOnboardingStatus,
    getRedirectRoute,
} = require('../utils/onboardingStatusTransitions');

async function resolveUserOnboardingStatus(userId) {
    const app = await OnboardingApplication.findOne({
        $or: [{ employee: userId }, { User: userId }],
    })
        .select('status')
        .lean();

    return normalizeOnboardingStatus(app?.status);
}

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

    const onboardingStatus = await resolveUserOnboardingStatus(user._id);
    const token = signToken(user);
    // Return token and user info
    return res.json({
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            onboardingStatus,
        },
        redirectTo: getRedirectRoute({ role: user.role, onboardingStatus }),
    });
}

// Get current authenticated user
async function me(req, res) {
    const onboardingStatus = await resolveUserOnboardingStatus(req.user._id);
    return res.json({
        user: { ...req.user.toObject(), onboardingStatus },
        redirectTo: getRedirectRoute({ role: req.user.role, onboardingStatus }),
    });
}

// Check invitation token status for registration page pre-check
async function getRegistrationTokenStatus(req, res) {
    const token = String(req.query.token || '').trim();
    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    const invitation = await RegistrationToken.findOne({ token }).lean();
    if (!invitation) {
        return res.status(200).json({
            status: 'invalid_or_expired',
            message: 'Invalid or expired invitation token',
        });
    }

    if (invitation.status !== 'unused') {
        return res.status(200).json({
            status: 'used',
            message: 'Invitation token has already been used',
            redirectTo: '/signin',
        });
    }

    const existingEmail = await User.findOne({ email: invitation.email }).lean();
    if (existingEmail) {
        return res.status(200).json({
            status: 'used',
            message: 'This invitation has already completed registration',
            redirectTo: '/signin',
        });
    }

    return res.status(200).json({ status: 'valid' });
}

// Register employee account with invitation token
async function registerWithToken(req, res) {
    try {
        const { token, username, password } = req.body;

        if (!token || !username || !password) {
            return res.status(400).json({ message: 'Token, username, and password are required' });
        }

        const invitation = await RegistrationToken.findOne({ token });
        if (!invitation) {
            return res.status(400).json({ message: 'Invalid or expired invitation token' });
        }
        if (invitation.status !== 'unused') {
            return res.status(409).json({ message: 'Invitation token has already been used' });
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
    getRegistrationTokenStatus,
    registerWithToken,
};
