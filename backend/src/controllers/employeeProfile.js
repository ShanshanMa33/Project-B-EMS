const employeeProfile = require('../models/employeeProfile');

// Get employee profile
exports.getEmployeeProfile = async (req, res, next) => {
    try {
        let profile = await employeeProfile.findOne({ user: req.user._id });
        if (!profile) {
            const username = String(req.user?.username || '').trim();
            const [firstNameFromUsername, ...rest] = username.split(/[._\s-]+/).filter(Boolean);
            profile = await employeeProfile.create({
                user: req.user._id,
                firstName: firstNameFromUsername || 'User',
                lastName: rest.join(' ') || 'Profile',
                preferredName: firstNameFromUsername || 'User',
                email: req.user?.email || '',
            });
        }
        res.json(profile);
    } catch (error) {
        next(error);
    }
};

// Update employee profile
exports.updateEmployeeProfile = async (req, res, next) => {
    try {
        const updates = req.body;
        const username = String(req.user?.username || '').trim();
        const [firstNameFromUsername, ...rest] = username.split(/[._\s-]+/).filter(Boolean);
        let profile = await employeeProfile.findOne({ user: req.user._id });

        if (!profile) {
            profile = new employeeProfile({
                user: req.user._id,
                firstName: firstNameFromUsername || 'User',
                lastName: rest.join(' ') || 'Profile',
                preferredName: firstNameFromUsername || 'User',
                email: req.user?.email || '',
            });
        }

        profile.set(updates);
        await profile.save();

        res.json(profile);
    } catch (error) {
        if (error?.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        return next(error);
    }
};
