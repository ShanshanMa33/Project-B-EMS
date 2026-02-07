const onboardingApplication = require('../models/onboardingApplication')
const onboardingStatusTransition = require('../utils/onboardingStatusTransitions');

// get onboarding application for current user
exports.getOnboardingApplication = async (req, res, next) => {
    try {
        const application = await onboardingApplication.find({ User: req.user._id });
        res.json(application);
    } catch (error) {
        next(error);
    }
};


//create onboarding application
exports.createOnboardingApplication = async (req, res, next) => {
    try {

        const isHR = req.user.role === 'hr';
        const app = await onboardingApplication.create({
            User: req.user._id,
            // Only allow HR to set position and department during creation
            positionTitle: isHR ? req.body.positionTitle : undefined,
            department: isHR ? req.body.department : undefined,
            startDate: isHR ? req.body.startDate : undefined,
            notes: isHR ? req.body.notes || '' : undefined,
            status: 'not_started',
            statusHistory: [{ status: 'not_started', changedAt: new Date() }],
        });
        res.status(201).json(app);
    } catch (error) {
        next(error);
    }
};

// Update onboarding application (employee can update their own application, HR can update any application)
exports.updateOnboardingApplication = async (req, res, next) => {
    try {
        const app = await onboardingApplication.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ message: 'Onboarding application not found' });
        }

        const isOwner = app.User.toString() === req.user._id.toString();
        const isHR = req.user.role === 'hr';

        if (!isOwner && !isHR) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to update this application' });
        }

        if (req.body.status && req.body.status !== app.status) {
            const canTransition = onboardingStatusTransition(req.user.role, app.status, req.body.status);
            if (!canTransition) {
                return res.status(400).json({ message: `Invalid status transition from ${app.status} to ${req.body.status} for role ${req.user.role}` });
            }

            app.status = req.body.status;
            app.statusHistory.push({ status: req.body.status, changedAt: new Date() });
        }

        const employeeEditable = [];
        const hrEditable = ['positionTitle', 'department', 'startDate', 'notes'];
        const editableFields = isHR ? hrEditable : (isOwner ? employeeEditable : []);

        editableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                app[field] = req.body[field];
            }
        });

        await app.save();
        res.json(app);
    } catch (error) {
        next(error);
    }
};
