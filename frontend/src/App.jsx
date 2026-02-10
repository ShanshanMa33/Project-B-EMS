import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./routes/protectedRoute";

import EmployeeDashboard from "./pages/employee/dashboard";
import EmployeeProfile from "./pages/employee/profile";
import VisaStatus from "./pages/employee/visaStatus";
import Onboarding from "./pages/employee/onboarding";
import EmployeeHome from "./pages/employee/home";
import SignIn from "./pages/auth/signin";

export default function App() {
    return (
        <Routes>
            <Route path="/signin" element={<SignIn />} />
            {/* Default route redirects to sign-in page */}
            <Route path="/" element={<Navigate to="/signin" replace />} />
            {/* Employee routes */}
            <Route element={<ProtectedRoute allowRoles={["employee"]} />}>
                <Route path="/dashboard/employee" element={<EmployeeDashboard />}>
                    <Route index element={<EmployeeHome />} />
                    <Route path="profile" element={<EmployeeProfile />} />
                    <Route path="visaStatus" element={<VisaStatus />} />
                    <Route path="onboarding" element={<Onboarding />} />
                </Route>
            </Route>
            {/* Redirect any unknown routes to employee dashboard as default */}
            <Route path="*" element={<Navigate to="/dashboard/employee" replace />} />
        </Routes>
    );
}