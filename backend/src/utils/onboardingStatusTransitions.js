const ONBOARDING_STATUS = Object.freeze({
    NOT_SUBMITTED: 'not_submitted',
    PENDING: 'pending',
    REJECTED: 'rejected',
    APPROVED: 'approved',
});

function normalizeOnboardingStatus(rawStatus) {
    const status = String(rawStatus || '').toLowerCase();
    if (!status || status === 'not_started' || status === 'in_progress') {
        return ONBOARDING_STATUS.NOT_SUBMITTED;
    }
    if (status === 'submitted' || status === 'in_review' || status === 'pending') {
        return ONBOARDING_STATUS.PENDING;
    }
    if (status === ONBOARDING_STATUS.REJECTED) return ONBOARDING_STATUS.REJECTED;
    if (status === ONBOARDING_STATUS.APPROVED) return ONBOARDING_STATUS.APPROVED;
    return ONBOARDING_STATUS.NOT_SUBMITTED;
}

function getRedirectRoute(user) {
    const role = String(user?.role || '').toLowerCase();
    if (role === 'hr') return '/hr/dashboard';
    if (role !== 'employee') return '/signin';

    const status = normalizeOnboardingStatus(user?.onboardingStatus);
    return status === ONBOARDING_STATUS.APPROVED
        ? '/dashboard/employee'
        : '/dashboard/employee/onboarding';
}

function canEmployeeEditOnboarding(currentStatus) {
    const status = normalizeOnboardingStatus(currentStatus);
    return status === ONBOARDING_STATUS.NOT_SUBMITTED || status === ONBOARDING_STATUS.REJECTED;
}

function canEmployeeSubmitOnboarding(currentStatus) {
    return canEmployeeEditOnboarding(currentStatus);
}

function canHrReviewOnboarding(currentStatus, targetStatus) {
    const current = normalizeOnboardingStatus(currentStatus);
    const target = normalizeOnboardingStatus(targetStatus);
    if (current !== ONBOARDING_STATUS.PENDING) return false;
    return target === ONBOARDING_STATUS.APPROVED || target === ONBOARDING_STATUS.REJECTED;
}

module.exports = {
    ONBOARDING_STATUS,
    normalizeOnboardingStatus,
    getRedirectRoute,
    canEmployeeEditOnboarding,
    canEmployeeSubmitOnboarding,
    canHrReviewOnboarding,
};
