import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchOnboarding } from "../store/onboardingSlice";
import { fetchCurrentUser } from "../store/authSlice";
import {
    getRedirectRoute,
    isEmployeeOnboardingRoute,
    normalizeOnboardingStatus,
} from "../utils/authWorkflow";

export default function ProtectedRoute({ allowRoles }) {
    const location = useLocation();
    const dispatch = useDispatch();

    const { token, user, loading: authLoading } = useSelector((state) => state.auth);
    const { loading, initialized, application } = useSelector((state) => state.onboarding);

    const role = typeof user?.role === "string" ? user.role.toLowerCase() : null;
    const normalizedAllowRoles = Array.isArray(allowRoles)
        ? allowRoles.map((r) => String(r).toLowerCase())
        : null;
    const isEmployee = role === "employee";

    useEffect(() => {
        if (!token) return;
        if (user || authLoading) return;
        dispatch(fetchCurrentUser());
    }, [dispatch, token, user, authLoading]);

    useEffect(() => {
        if (!token || !user || !isEmployee) return;
        if (!initialized && !loading) {
            dispatch(fetchOnboarding());
        }
    }, [dispatch, token, user, isEmployee, initialized, loading]);

    if (!token) {
        return <Navigate to="/signin" replace state={{ from: location }} />;
    }

    if (!user) {
        return <div>Loading...</div>;
    }

    if (normalizedAllowRoles && (!role || !normalizedAllowRoles.includes(role))) {
        return <Navigate to="/unauthorized" replace />;
    }

    if (isEmployee && !initialized) {
        return <div>Loading...</div>;
    }

    if (isEmployee) {
        const onboardingStatus = initialized
            ? normalizeOnboardingStatus(application?.status)
            : normalizeOnboardingStatus(user?.onboardingStatus);
        const redirectTo = getRedirectRoute({ ...user, onboardingStatus });
        const onOnboardingPage = isEmployeeOnboardingRoute(location.pathname);

        if (redirectTo === "/dashboard/employee/onboarding" && !onOnboardingPage) {
            return <Navigate to={redirectTo} replace />;
        }

        if (redirectTo === "/dashboard/employee" && onOnboardingPage) {
            return <Navigate to={redirectTo} replace />;
        }
    }

    return <Outlet />;
}
