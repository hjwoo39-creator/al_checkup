import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { captureAdminIdFromSearch, getConnectionId, getCurrentAdminId } from './utils/device';
import { api } from './api';
import HomePage from './pages/HomePage';
import BasicInfoPage from './pages/BasicInfoPage';
import ChecklistPage from './pages/ChecklistPage';
import ResultPage from './pages/ResultPage';
import CompletedPage from './pages/CompletedPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import SharePage from './pages/SharePage';

function PresenceTracker() {
  const location = useLocation();

  useEffect(() => {
    captureAdminIdFromSearch(location.search);
    const send = () => {
      api.sendPresence({
        connectionId: getConnectionId(),
        adminId: getCurrentAdminId(),
        page: location.pathname,
      }).catch(() => {});
    };
    send();
    const interval = setInterval(send, 30000);
    return () => clearInterval(interval);
  }, [location.pathname, location.search]);

  return null;
}

export default function App() {
  return (
    <>
      <PresenceTracker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/basic-info" element={<BasicInfoPage />} />
        <Route path="/checklist/:sectionIndex" element={<ChecklistPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/completed" element={<CompletedPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/share" element={<SharePage />} />
      </Routes>
    </>
  );
}
