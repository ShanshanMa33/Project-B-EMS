const jwt = require('jsonwebtoken');
const User = require('../models/users');

// Function to sign JWT token
function signToken(user) {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

// Middleware to authenticate JWT token, and authorize user roles.
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'] || "";
    const [type, token] = authHeader.split(' ');

    // Check if token is provided
    if (type !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
}

// Middleware to authorize based on user roles
function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this resource' });
        }
        next();
    }
}

module.exports = {
    signToken,
    authenticateToken,
    authorizeRoles,
};