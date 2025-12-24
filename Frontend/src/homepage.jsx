import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './themeContext.jsx';
import Footer from './Footer.jsx';

const Homepage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const handleClick = (label) => alert(`${label} clicked!`);
  const { theme } = useContext(ThemeContext);

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
      <header className={`fixed top-0 left-0 right-0 z-50 px-4 pt-6 pb-3 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} border-b border-gray-200`}>
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

      <main className="flex-1 px-4 pb-24 pt-28">
        <div className="max-w-xl mx-auto space-y-3">
          <div onClick={() => navigate('/chatbot')} className="bg-black text-white rounded-xl mt-7 p-5 flex items-center shadow-md cursor-pointer">
            <div className="w-full bg-white rounded-2xl px-4 py-3 inline-flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <img src="/assets/robothai.gif" alt="bot" className="w-full h-full object-cover" />
              </div>

              <div className="text-sm text-black font-medium">Hi! Ask me anything about campus.</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/events')} className="bg-white rounded-xl shadow p-0 flex flex-col items-center w-36 overflow-hidden relative">
              <img src="/assets/student-interest.png" alt="Student Interest" className="w-full h-36 object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-center py-2 text-sm font-medium">Student Interest</div>
            </button>

            <button onClick={() => navigate('/faculty')} className="bg-white rounded-xl shadow p-0 flex flex-col items-center w-36 overflow-hidden relative">
              <img src="/assets/prof.png" alt="Faculty & Staff" className="w-full h-36 object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-center py-2 text-sm font-medium">Faculty & Staff</div>
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
      <Footer />
    </div>
  );
};

export default Homepage;
