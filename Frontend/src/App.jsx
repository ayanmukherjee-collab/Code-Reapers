import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { BottomNav } from './components';
import { HomePage, MapPage, SchedulePage, ProfilePage, FacultyPage, ClubsPage, OnboardingPage } from './pages';
import { useUser } from './context/UserContext';
import { AdminProvider, useAdmin } from './admin-panel/context/AdminContext';
import AdminLayout from './admin-panel/components/AdminLayout';
import OrgSetup from './admin-panel/pages/OrgSetup';
import LoginPage from './pages/LoginPage';

import AdminDashboard from './admin-panel/pages/AdminDashboard';
import BuildingManager from './admin-panel/pages/BuildingManager';
import PersonnelManager from './admin-panel/pages/PersonnelManager';
import ScheduleManager from './admin-panel/pages/ScheduleManager';
import BroadcastCenter from './admin-panel/pages/BroadcastCenter';



const RequireAuth = ({ children }) => {
  const { user, loading } = useAdmin();
  if (loading) return <div className="p-10">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const DashboardOrSetup = () => {
  const { organization } = useAdmin();
  // If no organization, show setup. If organization exists, show Dashboard (which needs to be created or we use a placeholder)
  if (!organization) return <Navigate to="/admin/setup" replace />;
  return <AdminDashboard />;
};

const RequireUserAuth = () => {
  const { user, loading, hasOnboarded } = useUser();
  const location = useLocation();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // If NOT onboarded, and NOT on onboarding page -> Go to Onboarding
  if (!hasOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If ALREADY onboarded, and TRYING to go to Onboarding -> Go Home
  if (hasOnboarded && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

/**
 * CampusConnect App
 * Indoor navigation and campus utility app
 */
function App() {
  return (
    <AppContent />
  );
}

const AppContent = () => {
  const location = useLocation();
  const showNav = location.pathname !== '/onboarding' && location.pathname !== '/login' && !location.pathname.startsWith('/admin');

  return (
    <div className="relative min-h-screen bg-gray-50 text-base">
      <Routes>
        {/* Public / Auth Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected User Routes */}
        <Route element={<RequireUserAuth />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/faculty" element={<FacultyPage />} />
          <Route path="/clubs" element={<ClubsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminProvider>
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          </AdminProvider>
        }>
          <Route index element={<DashboardOrSetup />} />
          <Route path="setup" element={<OrgSetup />} />
          <Route path="buildings" element={<BuildingManager />} />
          <Route path="personnel" element={<PersonnelManager />} />
          <Route path="schedule" element={<ScheduleManager />} />
          <Route path="broadcast" element={<BroadcastCenter />} />
        </Route>
      </Routes>

      {/* Bottom Navigation */}
      {showNav && <BottomNav />}
    </div>
  );
};

export default App;