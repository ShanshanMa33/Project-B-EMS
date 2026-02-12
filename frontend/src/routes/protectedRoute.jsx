import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchOnboarding } from "../store/onboardingSlice";
import { fetchCurrentUser } from "../store/authSlice";

export default function ProtectedRoute({ allowRoles }) {
    const location = useLocation();
    const dispatch = useDispatch();

    const { token, user, loading: authLoading } = useSelector((state) => state.auth);
    const { application, loading, error } = useSelector((state) => state.onboarding);

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
        if (!application && !loading && !error) {
            dispatch(fetchOnboarding());
        }
    }, [dispatch, token, user, isEmployee, application, loading, error]);

    if (!token) {
        return <Navigate to="/signin" replace state={{ from: location }} />;
    }

    if (!user) {
        return <div>Loading...</div>;
    }

    if (normalizedAllowRoles && (!role || !normalizedAllowRoles.includes(role))) {
        return <Navigate to="/unauthorized" replace />;
    }

    if (isEmployee && loading && !application) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}
