import React from 'react';

const Home = () => {
  const handleClick = (label) => {
    alert(`${label} clicked!`);
  };

  return (
    // h-screen ensures the app takes the full height of the viewport
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      
      {/* FIXED HEADER */}
      <header className="flex items-center justify-between p-2 bg-white shadow-md shrink-0">
        <h1 className="text-xl p-2 self-end font-bold">LocAlte</h1>
      </header>

      {/* SCROLLABLE CONTAINER */}
      <main className="flex-1 overflow-y-auto">
        
        {/* FIXED TOP SECTION (Doesn't scroll internally, but moves with main content) */}
        <section className="grid grid-cols-2 gap-2 p-6 justify-items-center">
          <div className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer w-36 h-36" onClick={() => handleClick('Student Interest')}>
            <img src="/assets/student-interest.png" alt="Student Interest" className="w-full h-24 object-cover" />
            <p className="text-center p-1 text-sm font-medium">Student Interest</p>
          </div>
          <div className="bg-black rounded-lg shadow-md overflow-hidden cursor-pointer w-36 h-36 flex items-center justify-center" onClick={() => handleClick('Ask AI')}>
            <img src="/assets/robothai.gif" alt="Ask AI" className="w-24 h-24 object-cover" />
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer w-36 h-36" onClick={() => handleClick('Faculty & Staff')}>
            <img src="/assets/prof.png" alt="Faculty & Staff" className="w-full h-24 object-cover" />
            <p className="text-center p-1 text-sm font-medium">Faculty & Staff</p>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer w-36 h-36" onClick={() => handleClick('Buildings')}>
            <img src="/assets/building.png" alt="Buildings" className="w-full h-24 object-cover" />
            <p className="text-center p-1 text-sm font-medium">Buildings</p>
          </div>
        </section>

        <section className="px-4 mb-4">
          <button className="w-full bg-black py-3 rounded-md flex flex-col items-center" onClick={() => handleClick('Lost on campus? Start AR navigation now')}>
            <span className="text-xl text-white">Lost on campus?</span>
            <span className="text-sm text-gray-300">Start AR navigation now</span>
          </button>
        </section>

        {/* ONLY THIS SECTION WILL SCROLL IF CONTENT EXCEEDS HEIGHT */}
        <section className="p-4 pb-10">
          <h2 className="text-lg font-bold mb-2">Recent Searches</h2>
          {/* Repeat these items to test scrolling */}
          {[1].map((item) => (
            <div key={item} className="bg-white rounded-md shadow-md p-4 mb-3 cursor-pointer" onClick={() => handleClick('Library')}>
              <p className="font-medium">Library {item}</p>
              {/* <span className="text-gray-500 text-sm">Avdpne</span> */}
            </div>
          ))}
          <div className="bg-white rounded-md shadow-md p-4 cursor-pointer" onClick={() => handleClick('Washroom')}>
            <p className="font-medium">Washroom</p>
            {/* <span className="text-gray-500 text-sm">Student Center</span> */}
          </div>
        </section>
      </main>

      {/* FIXED FOOTER */}
      <footer className="flex justify-around items-center p-4 bg-white shadow-md shrink-0 border-t border-gray-200">
        <div className="text-2xl cursor-pointer"><i className="fas fa-home"></i></div>
        
        <div className="text-2xl cursor-pointer"><i className="fas fa-folder"></i></div>
        <div className="text-2xl cursor-pointer"><i className="fas fa-bell"></i></div>
        <div className="text-2xl cursor-pointer"><i className="fas fa-user"></i></div>
      </footer>

    </div>
  );
};

export default Home;