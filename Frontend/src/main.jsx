import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './homepage.jsx'
import FloorPlanScanner from './FloorPlanScanner.jsx'
import ChooseBuild from './buildings.jsx'
import Faculty from './faculty.jsx'

// Simple page router using hash-based navigation
function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    // Get initial page from URL hash
    const hash = window.location.hash.slice(1);
    return hash || 'home';
  });

  // Listen for hash changes
  useState(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setCurrentPage(hash || 'home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigate function for programmatic navigation
  window.navigateTo = (page) => {
    window.location.hash = page;
    setCurrentPage(page);
  };

  // Render current page
  switch (currentPage) {
    case 'scanner':
      return <FloorPlanScanner />;
    case 'buildings':
      return <ChooseBuild />;
    case 'faculty':
      return <Faculty />;
    case 'home':
    default:
      return <Home />;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
