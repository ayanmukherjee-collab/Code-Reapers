import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './themeContext.jsx';
import Footer from './Footer.jsx';

const Events = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { theme } = useContext(ThemeContext);

  const handleCardClick = (label) => {
    // Placeholder: you can route to detailed pages later
    alert(`${label} clicked`);
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
      <header className={`fixed top-0 left-0 right-0 z-50 px-6 pt-6 pb-3 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} border-b border-gray-200`}>
        <h1 className="text-3xl font-extrabold text-center">Hey buddy!!</h1>
      </header>

      <main className="flex-1 px-6 pb-24 pt-28">
        <div className="max-w-xl mx-auto">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2">
            {[
              { label: 'Clubs', icon: 'fa-shield-alt' },
              { label: 'Webinar', icon: 'fa-check' },
              { label: 'Events', icon: 'fa-calendar-days' },
              { label: 'Workshop', icon: 'fa-envelope' },
            ].map((c) => (
              <button
                key={c.label}
                onClick={() => handleCardClick(c.label)}
                className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center space-y-3 hover:shadow-lg active:scale-95 transition-transform"
                aria-label={c.label}
              >
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl text-gray-600">
                  <i className={`fa-solid ${c.icon}`}></i>
                </div>
                <div className="text-sm font-medium text-gray-700">{c.label}</div>
              </button>
            ))}
          </div>
        </div>
      </main>

        {/* FIXED FOOTER WITH LABELS */}
       <Footer />
    </div>
  );
};

export default Events;
