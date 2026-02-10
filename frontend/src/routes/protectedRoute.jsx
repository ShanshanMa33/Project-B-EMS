import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ allowRoles }) {
    const { token, user } = useSelector((state) => state.auth);

    if (!token) {
        return <Navigate to="/signin" replace />;
    }
    if (allowRoles && user.role && !allowRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }
    return <Outlet />;
}