import React from 'react';
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
  const navigate = useNavigate();
  const handleClick = (label) => alert(`${label} clicked!`);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-4 pt-8 pb-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center font-bold text-xl">LocAlte</div>
          <div className="mt-4 relative">
            <span className="material-symbols-outlined text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
            <input
              type="search"
              placeholder="Search in shortcut..."
              className="w-full bg-white rounded-full px-4 py-3 shadow-sm outline-none pl-12"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-6">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="bg-black text-white rounded-2xl p-4 flex items-center shadow-md">
            <div className="w-15 h-15 bg-white/10 rounded-full flex items-center justify-center mr-4">
              <img src="/assets/robothai.gif" alt="bot" className="w-15 h-15" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Hi! Ask me anything about campus.</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/events')} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <i className="fa-solid fa-star text-gray-700"></i>
              </div>
              <div className="text-sm font-medium">Student Interests</div>
            </button>

            <button onClick={() => navigate('/faculty')} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <i className="fa-solid fa-users text-gray-700"></i>
              </div>
              <div className="text-sm font-medium">Faculty & Staff</div>
            </button>
          </div>

          <div>
              <button className="w-full bg-black py-3 rounded-md flex flex-col items-center" onClick={() => handleClick('Lost on campus? Start AR navigation now')}>
                <span className="text-xl text-white inline-flex items-center">
                  Lost on campus?
                  <span className="material-symbols-outlined  text-[28px]  ml-2 ">double_arrow</span>
                </span>
                <span className="text-sm text-gray-300">Start AR navigation now</span>
              </button>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <h3 className="font-semibold mb-2">Recent Searches</h3>
            <ul className="text-sm text-gray-600">
              <li className="py-2 border-b last:border-b-0">Library</li>
              <li className="py-2">Washroom</li>
            </ul>
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

export default Homepage;
