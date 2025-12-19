import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

//   const handleItem = (label) => {
//     if (label === 'Edit Profile') navigate('/faculty');
//     else if (label === 'Offline Maps') alert('Offline Maps');
//     else if (label === 'My Clubs') alert('My Clubs');
//     else if (label === 'Semester') alert('Semester');
//     else if (label === 'Notifications') alert('Notifications');
//     else if (label === 'App Language') alert('App Language');
//     else if (label === 'Theme') alert('Theme');
//   };

  const handleHelpAction = (action) => {
    if (action === 'Delete account') {
      if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
        alert('Account deleted (dummy)');
      }
    } else if (action === 'Report an issue') {
      alert('Open report form');
    } else if (action === 'Contact admin') {
      alert('Contacting admin...');
    } else if (action === 'FAQs') {
      alert('Show FAQs');
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col">
      <div className="max-w-xl w-full mx-auto flex-1">
        <header className="px-6 pt-10 pb-4">
          <h1 className="text-3xl font-extrabold">Profile</h1>
        </header>

        <main className="px-4 pb-6">
          <section className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 mr-4" />
              <div className="flex-1">
                <div className="font-semibold">John</div>
                <div className="text-sm text-gray-500">Show profile</div>
              </div>
              <button onClick={() => navigate('/faculty')} className="text-gray-400">
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </section>

          {/* <section className="mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md flex items-center justify-between">
              <div>
                <div className="font-bold">Airbnb your place</div>
                <div className="text-sm text-gray-500">It's simple to get set up and start earning.</div>
              </div>
              <img src="/assets/building.png" alt="promo" className="w-20 h-14 object-cover rounded-md ml-4" />
            </div>
          </section> */}

          <section>
            <h2 className="text-lg font-semibold mb-3">Account settings</h2>

            <ul className="bg-white rounded-xl divide-y divide-gray-100 shadow-sm overflow-hidden">
              {[
                'Edit Profile',
                'Offline Maps',
                'My Clubs',
                'Semester',
                'Notifications',
                'App Language',
                'Theme',
              ].map((item) => (
                <li key={item} className="p-4 flex items-center justify-between cursor-pointer" onClick={() => handleItem(item)}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <i className="fa-solid fa-circle"></i>
                    </div>
                    <span className="font-medium">{item}</span>
                  </div>
                  <i className="fa-solid fa-chevron-right text-gray-300"></i>
                </li>
              ))}

              <li className="p-4 flex flex-col">
                <button onClick={() => setHelpOpen((s) => !s)} className="w-full flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <i className="fa-solid fa-circle-question"></i>
                    </div>
                    <span className="font-medium">Help and Feedback</span>
                  </div>
                  <i className={`fa-solid fa-chevron-${helpOpen ? 'up' : 'right'} text-gray-300`}></i>
                </button>

                {helpOpen && (
                  <div className="mt-3 space-y-2 pl-11">
                    {['FAQs', 'Report an issue', 'Contact admin', 'Delete account'].map((h) => (
                      <button key={h} onClick={() => handleHelpAction(h)} className="w-full text-left text-sm text-gray-700 py-2">
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </li>

              <li className="p-4">
                <button onClick={() => { alert('Logged out'); navigate('/'); }} className="w-full text-left font-medium text-red-600">
                  Log out
                </button>
              </li>
            </ul>
          </section>
        </main>
      </div>

       {/* FIXED FOOTER WITH LABELS */}
      <footer className="flex justify-around items-center p-2 bg-white shadow-md shrink-0 border-t border-gray-200">
        <div className="flex flex-col items-center cursor-pointer text-black" onClick={() => navigate('/')}>
          <i className="fas fa-home text-xl"></i>
          <span className="text-[10px] font-bold">Home</span>
        </div>
        
        <div className="flex flex-col items-center cursor-pointer text-gray-400" onClick={() => handleClick('Resources')}>
          <i className="fa-regular fa-map"></i>
          <span className="text-[10px] font-bold">Map</span>
        </div>

        <div className="flex flex-col items-center cursor-pointer text-gray-400" onClick={() => handleClick('Alerts')}>
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

export default Profile;
