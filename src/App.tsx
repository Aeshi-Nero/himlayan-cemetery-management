import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { MemorialLotsPage } from './pages/MemorialLotsPage';
import { LotDetailPage } from './pages/LotDetailPage';
import { MemorialMapPage } from './pages/MemorialMapPage';
import { InquiryPage } from './pages/InquiryPage';
import { LoginPage } from './pages/LoginPage';
import { EngineerWorkspacePage } from './pages/EngineerWorkspacePage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { DeceasedRecordsPage } from './pages/admin/DeceasedRecordsPage';
import { InquiriesPage } from './pages/admin/InquiriesPage';
import { ContractsPage } from './pages/admin/ContractsPage';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { BurialSchedulingPage } from './pages/admin/BurialSchedulingPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { MapEditorPage } from './pages/admin/MapEditorPage';
import { PlotsPage } from './pages/admin/PlotsPage';
import { PathwaysPage } from './pages/admin/PathwaysPage';
import { UsersPage } from './pages/admin/UsersPage';
import { AuditPage } from './pages/admin/AuditPage';
import { SettingsPage } from './pages/admin/SettingsPage';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/lots" element={<MemorialLotsPage />} />
        <Route path="/lots/:id" element={<LotDetailPage />} />
        <Route path="/map" element={<MemorialMapPage />} />
        <Route path="/inquiry" element={<InquiryPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Dedicated Engineer Workspace */}
        <Route
          path="/engineer/workspace"
          element={
            <ProtectedRoute allowedRoles={['engineer', 'super_admin']}>
              <EngineerWorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Console Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="records" element={<DeceasedRecordsPage />} />
          <Route path="inquiries" element={<InquiriesPage />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="burials" element={<BurialSchedulingPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="map-editor" element={<MapEditorPage />} />
          <Route path="plots" element={<PlotsPage />} />
          <Route path="pathways" element={<PathwaysPage />} />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route path="audit" element={<AuditPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
