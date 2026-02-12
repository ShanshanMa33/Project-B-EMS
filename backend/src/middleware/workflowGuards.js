const OnboardingApplication = require('../models/onboardingApplication');
const {
    ONBOARDING_STATUS,
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

async function requireApprovedOnboarding(req, res, next) {
    try {
        if (String(req.user?.role || '').toLowerCase() !== 'employee') {
            return res.status(403).json({ message: 'Forbidden: employee access only' });
        }

        const onboardingStatus = await resolveUserOnboardingStatus(req.user._id);
        if (onboardingStatus !== ONBOARDING_STATUS.APPROVED) {
            return res.status(403).json({
                message: 'Onboarding not approved yet',
                onboardingStatus,
                redirectTo: getRedirectRoute({ role: req.user.role, onboardingStatus }),
            });
        }

        req.onboardingStatus = onboardingStatus;
        return next();
    } catch (error) {
        return next(error);
    }
}

function requireHr(req, res, next) {
    if (String(req.user?.role || '').toLowerCase() !== 'hr') {
        return res.status(403).json({ message: 'Forbidden: HR access only' });
    }
    return next();
}

module.exports = {
    resolveUserOnboardingStatus,
    requireApprovedOnboarding,
    requireHr,
};
