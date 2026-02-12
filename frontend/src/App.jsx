import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./routes/protectedRoute";

import EmployeeDashboard from "./pages/employee/dashboard";
import EmployeeProfile from "./pages/employee/profile";
import EmployeeVisaStatus from "./pages/employee/visaStatus";
import Onboarding from "./pages/employee/onboarding";
import EmployeeHome from "./pages/employee/home";
import SignIn from "./pages/auth/signin";
import Register from "./pages/auth/register";
import Unauthorized from "./pages/unauthorized";
import Layout from "./components/Layout";

import HrEmployeeProfiles from "./pages/hr/EmployeeProfiles";
import EmployeeProfileDetail from "./pages/hr/EmployeeProfileDetail";
import HrVisaStatus from "./pages/hr/VisaStatus";
import HiringManagement from "./pages/hr/HiringManagement";
import HrDashboard from "./pages/hr/DashBoard";

export default function App() {
    return (
        <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/signin" replace />} />

            <Route element={<ProtectedRoute allowRoles={["employee"]} />}>
                <Route path="/dashboard/employee" element={<EmployeeDashboard />}>
                    <Route index element={<EmployeeHome />} />
                    <Route path="profile" element={<EmployeeProfile />} />
                    <Route path="visaStatus" element={<EmployeeVisaStatus />} />
                    <Route path="onboarding" element={<Onboarding />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowRoles={["hr"]} />}>
                <Route path="/hr/profiles" element={<HrEmployeeProfiles />} />
                <Route path="/hr/profiles/:userId" element={<EmployeeProfileDetail />} />
                <Route
                    path="/hr/profile"
                    element={(
                        <Layout activePage="My Profile">
                            <EmployeeProfile />
                        </Layout>
                    )}
                />
                <Route path="/hr/visa" element={<HrVisaStatus />} />
                <Route path="/hr/hiring" element={<HiringManagement />} />
                <Route path="/hr/dashboard" element={<HrDashboard />} />
            </Route>

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
    );
}
