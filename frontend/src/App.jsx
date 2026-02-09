import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EmployeeProfiles from './pages/hr/EmployeeProfiles';
import VisaStatus from './pages/hr/VisaStatus'
import HiringManagement from './pages/hr/HiringManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. 默认首页 */}
        <Route path="/" element={<Navigate to="/hr/profiles" />} />

        {/* 2. HR 的员工列表页 */}
        <Route path="/hr/profiles" element={<EmployeeProfiles />} />
        <Route path="/hr/visa" element={<VisaStatus />} />
        <Route path="/hr/hiring" element={<HiringManagement />} />

        {/* <Route path="/hr/employee/:id" element={<EmployeeDetail />} /> */}

        {/* 4. 404 页面 */}
        <Route path="*" element={<h1>404 Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
