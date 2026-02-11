import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Layout from "../../components/Layout";

export default function EmployeeDashboardLayout() {
    const location = useLocation();

    const activePage = React.useMemo(() => {
        const p = location.pathname;
        if (p.includes("/profile")) return "My Profile";
        if (p.includes("/visaStatus")) return "Visa Status";
        if (p.includes("/onboarding")) return "Onboarding";
        return "Dashboard";
    }, [location.pathname]);

    return (
        <Layout activePage={activePage}>
            <Outlet />
        </Layout>
    );
}
