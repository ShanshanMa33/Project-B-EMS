const onboardingStatusTransition = (role, currentStatus, targetStatus) => {
    if (role === 'employee') {

        // Employee can only move forward in the process
        return ((currentStatus === 'in_progress' && targetStatus === 'pending') ||
            (currentStatus === 'rejected' && targetStatus === 'pending'));
    }
}

module.exports = onboardingStatusTransition;