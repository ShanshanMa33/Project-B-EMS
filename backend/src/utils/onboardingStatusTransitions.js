const onboardingStatusTransition = (role, currentStatus, targetStatus) => {
    if (role === 'employee') {

        // Employee can only move forward in the process
        return ((currentStatus === 'not_started' && targetStatus === 'in_progress') ||
            (currentStatus === 'in_progress' && targetStatus === 'submitted') ||
            (currentStatus === 'rejected' && targetStatus === 'in_progress'));
    }
}

module.exports = onboardingStatusTransition;