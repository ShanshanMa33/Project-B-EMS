import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ allowRoles }) {
    const { token, user } = useSelector((state) => state.auth);
    const role = typeof user?.role === "string" ? user.role.toLowerCase() : null;
    const normalizedAllowRoles = Array.isArray(allowRoles)
        ? allowRoles.map((r) => String(r).toLowerCase())
        : null;

    if (!token) {
        return <Navigate to="/signin" replace />;
    }
    if (!user) {
        return <Navigate to="/signin" replace />;
    }
    if (normalizedAllowRoles && (!role || !normalizedAllowRoles.includes(role))) {
        return <Navigate to="/unauthorized" replace />;
    }
    return <Outlet />;
}
