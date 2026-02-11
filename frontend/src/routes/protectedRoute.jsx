import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchOnboarding } from "../store/onboardingSlice";
import { fetchCurrentUser } from "../store/authSlice";

export default function ProtectedRoute({ allowRoles }) {
    const location = useLocation();
    const dispatch = useDispatch();

    const { token, user, loading: authLoading } = useSelector((state) => state.auth);
    const { application, loading, error } = useSelector((state) => state.onboarding);

    // Determine if user is an employee and if they have an approved onboarding application
    const isEmployee = user?.role === "employee";

    // check if they have an approved onboarding application (only relevant for employees)
    useEffect(() => {
        // guard inside
        if (!token) return;
        if (!user) return;
        if (!isEmployee) return;

        if (!application && !loading && !error) {
            dispatch(fetchOnboarding());
        }
    }, [dispatch, token, user, isEmployee, application, loading, error]);

    useEffect(() => {
        if (!token) return;
        if (user || authLoading) return;
        dispatch(fetchCurrentUser());
    }, [dispatch, token, user, authLoading]);

    // 1) auth check
    if (!token) {
        return <Navigate to="/signin" replace state={{ from: location }} />;
    }

    // 2) wait until user is ready (avoid user.role crash on refresh)
    if (!user) {
        return <div>Loading...</div>;
    }

    // 3) role check
    if (allowRoles && user?.role && !allowRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // still loading onboarding => don't render route yet
    if (isEmployee && loading && !application) {
        return <div>Loading...</div>;
    }



    return <Outlet />;
}