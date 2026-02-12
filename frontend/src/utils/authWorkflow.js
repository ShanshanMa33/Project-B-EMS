export const ONBOARDING_STATUS = Object.freeze({
    NOT_SUBMITTED: "not_submitted",
    PENDING: "pending",
    REJECTED: "rejected",
    APPROVED: "approved",
});

export function normalizeOnboardingStatus(rawStatus) {
    const status = String(rawStatus || "").toLowerCase();
    if (!status || status === "not_started" || status === "in_progress") {
        return ONBOARDING_STATUS.NOT_SUBMITTED;
    }
    if (status === "submitted" || status === "in_review" || status === "pending") {
        return ONBOARDING_STATUS.PENDING;
    }
    if (status === ONBOARDING_STATUS.REJECTED) return ONBOARDING_STATUS.REJECTED;
    if (status === ONBOARDING_STATUS.APPROVED) return ONBOARDING_STATUS.APPROVED;
    return ONBOARDING_STATUS.NOT_SUBMITTED;
}

export function getRedirectRoute(user) {
    const role = String(user?.role || "").toLowerCase();
    if (role === "hr") return "/hr/dashboard";
    if (role !== "employee") return "/signin";

    const status = normalizeOnboardingStatus(user?.onboardingStatus);
    return status === ONBOARDING_STATUS.APPROVED
        ? "/dashboard/employee"
        : "/dashboard/employee/onboarding";
}

export function isEmployeeOnboardingRoute(pathname) {
    return String(pathname || "").startsWith("/dashboard/employee/onboarding");
}
