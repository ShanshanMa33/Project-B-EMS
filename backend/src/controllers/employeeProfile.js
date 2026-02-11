const employeeProfile = require('../models/employeeProfile');

// Get employee profile
exports.getEmployeeProfile = async (req, res, next) => {
    try {
        const profile = await employeeProfile.findOne({ user: req.user._id });
        if (!profile) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }
        const result = profile.toObject();
        if (!result.email && req.user?.email) {
            result.email = req.user.email;
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Update employee profile
exports.updateEmployeeProfile = async (req, res, next) => {
    try {
        const updates = { ...req.body };
        delete updates.email;
        const profile = await employeeProfile.findOneAndUpdate(
            { user: req.user._id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.json(profile);
    } catch (error) {
        next(error);
    }
};