import React from 'react';
import { useNavigate } from 'react-router-dom';

const Events = () => {
  const navigate = useNavigate();

  const handleCardClick = (label) => {
    // Placeholder: you can route to detailed pages later
    alert(`${label} clicked`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="px-6 pt-10 pb-6">
        <h1 className="text-3xl font-extrabold text-center">Hey buddy!!</h1>
      </header>

      <main className="flex-1 px-6 pb-6">
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
      <footer className="flex justify-around items-center p-2 bg-white shadow-md shrink-0 border-t border-gray-200">
        <div className="flex flex-col items-center cursor-pointer text-black" onClick={() => navigate('/')}>
          <i className="fas fa-home text-xl"></i>
          <span className="text-[10px] font-bold">Home</span>
        </div>
        
        <div className="flex flex-col items-center cursor-pointer text-gray-400" onClick={() => alert('Resources')}>
          <i className="fa-regular fa-map"></i>
          <span className="text-[10px] font-bold">Map</span>
        </div>

        <div className="flex flex-col items-center cursor-pointer text-gray-400" onClick={() => alert('Alerts')}>
          <i className="fas fa-bell text-xl"></i>
          <span className="text-[10px] font-bold">Alerts</span>
        </div>

        <div className="flex flex-col items-center cursor-pointer text-gray-400" onClick={() => navigate('/profile')}>
          <i className="fas fa-user text-xl"></i>
          <span className="text-[10px] font-bold">Profile</span>
        </div>
      </footer>
    </div>
  );
};

export default Events;
