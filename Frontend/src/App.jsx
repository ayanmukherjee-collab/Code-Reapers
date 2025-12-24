import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { BottomNav } from './components';
import { HomePage, MapPage, SchedulePage, ProfilePage, FacultyPage, ClubsPage, OnboardingPage } from './pages';
import { useUser } from './context/UserContext';
import { AdminProvider } from './admin-panel/context/AdminContext';
import AdminLayout from './admin-panel/components/AdminLayout';
import OrgSetup from './admin-panel/pages/OrgSetup';

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
  const { hasOnboarded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!hasOnboarded && location.pathname !== '/onboarding') {
      navigate('/onboarding');
    }
  }, [hasOnboarded, navigate, location]);

  const showNav = location.pathname !== '/onboarding';

  return (
    <div className="relative min-h-screen bg-gray-50 text-base">
      {/* Main Routes */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/faculty" element={<FacultyPage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminProvider>
            <AdminLayout />
          </AdminProvider>
        }>
          <Route index element={<OrgSetup />} />
          <Route path="buildings" element={<div className="text-3xl font-bold">Building Manager</div>} />
          <Route path="personnel" element={<div className="text-3xl font-bold">Personnel Manager</div>} />
          <Route path="schedule" element={<div className="text-3xl font-bold">Schedule Manager</div>} />
          <Route path="broadcast" element={<div className="text-3xl font-bold">Broadcast Center</div>} />
        </Route>
      </Routes>

      {/* Bottom Navigation (Hidden on Onboarding and Admin) */}
      {showNav && !location.pathname.startsWith('/admin') && <BottomNav />}
    </div>
  );
};

export default App;