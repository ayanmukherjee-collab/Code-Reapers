import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { BottomNav } from './components';
import { HomePage, MapPage, SchedulePage, ProfilePage, FacultyPage, ClubsPage, OnboardingPage } from './pages';
import { useUser } from './context/UserContext';

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
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/faculty" element={<FacultyPage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Routes>

      {/* Bottom Navigation (Hidden on Onboarding) */}
      {showNav && <BottomNav />}
    </div>
  );
};

export default App;