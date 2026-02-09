import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EmployeeProfiles from './pages/hr/EmployeeProfiles';
// 导入其他页面...

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. 默认首页，你可以暂时让它重定向到 profiles */}
        <Route path="/" element={<Navigate to="/hr/profiles" />} />

        {/* 2. HR 的员工列表页 */}
        <Route path="/hr/profiles" element={<EmployeeProfiles />} />

        {/* 3. 预留：员工详情页 (下一部分我们要写的) */}
        {/* <Route path="/hr/employee/:id" element={<EmployeeDetail />} /> */}

        {/* 4. 404 页面 */}
        <Route path="*" element={<h1>404 Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
