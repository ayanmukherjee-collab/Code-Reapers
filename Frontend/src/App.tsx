import { useState } from 'react';

const App = () => {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'faculty' | 'map' | 'schedule' | 'profile'>('home');
  const [facultySearch, setFacultySearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ department: 'All', semester: 'All' });

  const facultyData = [
    { id: 1, name: 'Dr. Anup', title: 'Professor, Physics', dept: 'Physics', semester: 'Fall' },
    { id: 2, name: 'Dr. Priya', title: 'Professor, Chemistry', dept: 'Chemistry', semester: 'Spring' },
    { id: 3, name: 'Mr. Rahul', title: 'Professor, Mathematics', dept: 'Mathematics', semester: 'Fall' },
    { id: 4, name: 'Dr. Sarah', title: 'Professor, Biology', dept: 'Biology', semester: 'Summer' },
    { id: 5, name: 'Mr. Amit', title: 'Assistant Professor, CS', dept: 'Computer Science', semester: 'Fall' },
  ];

  const filteredFaculty = facultyData.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(facultySearch.toLowerCase()) || f.title.toLowerCase().includes(facultySearch.toLowerCase());
    const matchesDept = filters.department === 'All' || f.dept === filters.department;
    const matchesSemester = filters.semester === 'All' || f.semester === filters.semester;
    return matchesSearch && matchesDept && matchesSemester;
  });

  const examsData = [
    { id: 1, dept: 'Physics', semester: 'Fall', section: 'A', date: 'Oct 24, 2025', time: '09:00 AM', location: 'Science Hall B' },
    { id: 2, dept: 'Mathematics', semester: 'Fall', section: 'B', date: 'Oct 26, 2025', time: '11:00 AM', location: 'Math Building 1' },
  ];

  const scheduleEvents = [
    { id: 1, title: 'Tech Innovation Summit', date: 'Oct 28, 2025', time: '02:30 PM', location: 'Auditorium Main' },
    { id: 2, title: 'Founders Day Celebration', date: 'Nov 02, 2025', time: '06:00 PM', location: 'Campus Green' },
  ];

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <main className="pt-24 pb-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {activeTab === 'faculty' ? (
          <section className="animate-fade-in-up">
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-400">search</span>
                </div>
                <input value={facultySearch} onChange={(e) => setFacultySearch(e.target.value)} className="block w-full pl-11 pr-4 py-4 bg-surface-light dark:bg-surface-dark border-none rounded-2xl shadow-soft focus:ring-2 focus:ring-primary dark:text-white placeholder-gray-400 transition-all" placeholder="Search faculty by name or title..." />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-primary transition-colors" onClick={() => { /* voice action */ }}>
                    <span className="material-icons">mic</span>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-primary transition-colors" onClick={() => setShowFilter(!showFilter)} aria-expanded={showFilter} aria-controls="faculty-filter">
                    <span className="material-icons">tune</span>
                  </button>
                </div>
              </div>
              {showFilter && (
                <div id="faculty-filter" className="mt-3 p-4 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-soft">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Department</label>
                      <select value={filters.department} onChange={(e) => setFilters((s) => ({ ...s, department: e.target.value }))} className="mt-2 w-full rounded-md border border-gray-200 p-2">
                        <option>All</option>
                        <option>Physics</option>
                        <option>Chemistry</option>
                        <option>Mathematics</option>
                        <option>Biology</option>
                        <option>Computer Science</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Semester</label>
                      <select value={filters.semester} onChange={(e) => setFilters((s) => ({ ...s, semester: e.target.value }))} className="mt-2 w-full rounded-md border border-gray-200 p-2">
                        <option>All</option>
                        <option>Fall</option>
                        <option>Spring</option>
                        <option>Summer</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end space-x-2">
                    <button className="px-3 py-2 rounded-md" onClick={() => { setFilters({ department: 'All', semester: 'All' }); setShowFilter(false); }}>Clear</button>
                    <button className="px-3 py-2 rounded-md bg-primary text-white" onClick={() => setShowFilter(false)}>Apply</button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {filteredFaculty.map((f) => (
                <div key={f.id} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-soft flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    <div className="text-xl font-bold text-surface-dark">{f.name.split(' ')[1]?.[0] || 'F'}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-surface-dark dark:text-white truncate">{f.name}</h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{f.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : activeTab === 'schedule' ? (
          <section className="animate-fade-in-up">
            <h1 className="text-2xl font-bold text-surface-dark dark:text-white mb-4">Schedule</h1>

            <h2 className="text-lg font-semibold text-surface-dark dark:text-white mt-2 mb-3">Upcoming Exams</h2>
            <div className="space-y-3">
              {examsData.map((ex) => (
                <div key={ex.id} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-soft flex items-center space-x-4 border-l-4 border-red-500">
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                    <span className="text-xs font-bold text-red-500 uppercase">{ex.date.split(' ')[0]}</span>
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">{ex.date.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-surface-dark dark:text-white truncate">{ex.dept} — {ex.semester} — Sec {ex.section}</h3>
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark flex items-center">
                      <span className="material-icons text-xs mr-1">schedule</span> {ex.time} — {ex.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-lg font-semibold text-surface-dark dark:text-white mt-6 mb-3">Upcoming Events</h2>
            <div className="space-y-3">
              {scheduleEvents.map((ev) => (
                <div key={ev.id} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-soft flex items-center space-x-4 border-l-4 border-primary">
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-center">
                    <span className="text-xs font-bold text-primary uppercase">{ev.date.split(' ')[0]}</span>
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{ev.date.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-surface-dark dark:text-white truncate">{ev.title}</h3>
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark flex items-center">
                      <span className="material-icons text-xs mr-1">schedule</span> {ev.time} — {ev.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="mb-8 animate-fade-in-up">
              <h1 className="text-3xl font-bold text-surface-dark dark:text-white mb-2">Hello, Alexander 👋</h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">Where would you like to navigate today?</p>
              <div className="mt-6 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                </div>
                <input className="block w-full pl-11 pr-4 py-4 bg-surface-light dark:bg-surface-dark border-none rounded-2xl shadow-soft focus:ring-2 focus:ring-primary dark:text-white placeholder-gray-400 transition-all" placeholder="Find a classroom, lab, or faculty office..." type="text" />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                    <span className="material-icons">mic</span>
                  </button>
                </div>
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-surface-dark dark:text-white">Quick Access</h2>
                <button className="text-sm font-medium text-primary hover:text-orange-600 dark:hover:text-orange-300 transition-colors">View All</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => setActiveTab('home')} className="group relative bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center" aria-pressed={activeTab === 'home'}>
                  <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <span className="material-icons text-surface-dark dark:text-blue-300 group-hover:text-white text-2xl">interests</span>
                  </div>
                  <h3 className="font-semibold text-surface-dark dark:text-white mb-1">Student Interest</h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Clubs &amp; Activities</p>
                </button>
                <button onClick={() => setActiveTab('faculty')} className={`group relative p-6 rounded-2xl shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center ${activeTab === 'faculty' ? 'bg-surface-dark dark:bg-black' : 'bg-surface-light dark:bg-surface-dark'}`} aria-pressed={activeTab === 'faculty'}>
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 ${activeTab === 'faculty' ? 'bg-primary text-white' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                    <span className="material-icons text-2xl">person_search</span>
                  </div>
                  <h3 className={`font-semibold ${activeTab === 'faculty' ? 'text-white' : 'text-surface-dark dark:text-white'} mb-1`}>Faculty</h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Staff Directory</p>
                </button>
                <a className="group relative bg-surface-dark dark:bg-black p-6 rounded-2xl shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center border border-transparent hover:border-primary/50" href="#">
                  <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <span className="material-icons text-primary text-2xl">smart_toy</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Ask AI</h3>
                  <p className="text-xs text-gray-400">Campus Assistant</p>
                  <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                </a>
                <a className="group relative bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center" href="#">
                  <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <span className="material-icons text-gray-600 dark:text-gray-300 group-hover:text-white text-2xl">apartment</span>
                  </div>
                  <h3 className="font-semibold text-surface-dark dark:text-white mb-1">Buildings</h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Interactive Map</p>
                </a>
              </div>
            </section>

            <section className="pb-8">
              <h2 className="text-xl font-bold text-surface-dark dark:text-white mb-4">Current Events</h2>
              <div className="space-y-4">
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-soft flex items-center space-x-4 border-l-4 border-red-500 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                    <span className="text-xs font-bold text-red-500 uppercase">OCT</span>
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">24</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-surface-dark dark:text-white truncate">Mid-Term Exams</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Academic
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark flex items-center">
                      <span className="material-icons text-xs mr-1">schedule</span> 09:00 AM - Science Hall B
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <button className="text-gray-400 hover:text-primary">
                      <span className="material-icons">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-soft flex items-center space-x-4 border-l-4 border-primary hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-center">
                    <span className="text-xs font-bold text-primary uppercase">OCT</span>
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">28</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-surface-dark dark:text-white truncate">Tech Innovation Summit</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        Seminar
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark flex items-center">
                      <span className="material-icons text-xs mr-1">schedule</span> 02:30 PM - Auditorium Main
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <button className="text-gray-400 hover:text-primary">
                      <span className="material-icons">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-soft flex items-center space-x-4 border-l-4 border-purple-500 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                    <span className="text-xs font-bold text-purple-500 uppercase">NOV</span>
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400">02</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-surface-dark dark:text-white truncate">Founders Day Celebration</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Social
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark flex items-center">
                      <span className="material-icons text-xs mr-1">schedule</span> 06:00 PM - Campus Green
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <button className="text-gray-400 hover:text-primary">
                      <span className="material-icons">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl overflow-hidden relative shadow-lg mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-surface-dark to-blue-900 dark:from-black dark:to-surface-dark"></div>
              <div className="relative p-8 md:flex md:items-center md:justify-between">
                <div className="mb-6 md:mb-0 md:mr-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Lost on Campus?</h2>
                  <p className="text-blue-100 max-w-md">Try our new Augmented Reality navigation feature to find your way around complex buildings.</p>
                </div>
                <button className="bg-primary hover:bg-orange-500 text-surface-dark font-bold py-3 px-6 rounded-xl transition-transform hover:scale-105 shadow-glow flex items-center">
                  <span className="material-icons mr-2">view_in_ar</span>
                  Start AR Nav
                </button>
              </div>
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary opacity-10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-400 opacity-10 rounded-full blur-2xl"></div>
            </section>
          </>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md z-40">
        <div className="bg-surface-dark dark:bg-surface-dark/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 dark:border-gray-600 p-2 flex justify-around items-center">
          <a role="button" onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center p-2 rounded-xl w-16 transition-all duration-300 group ${activeTab === 'home' ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <span className="material-icons group-hover:scale-110 transition-transform">home</span>
            <span className="text-[10px] font-medium mt-1">Home</span>
            {activeTab === 'home' && <span className="absolute bottom-0 w-6 h-1 bg-primary rounded-full"></span>}
          </a>
          <a role="button" onClick={() => setActiveTab('faculty')} className={`flex flex-col items-center justify-center p-2 rounded-xl w-16 transition-all duration-300 group ${activeTab === 'faculty' ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <span className="material-icons group-hover:scale-110 transition-transform">person_search</span>
            <span className="text-[10px] font-medium mt-1">Faculty</span>
          </a>
          <div className="relative -top-8">
            <button onClick={() => setActiveTab('map')} className="h-16 w-16 rounded-full bg-primary shadow-glow flex items-center justify-center transform hover:scale-105 transition-all duration-300 text-surface-dark">
              <span className="material-icons text-3xl">map</span>
            </button>
          </div>
          <a role="button" onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center justify-center p-2 rounded-xl w-16 transition-all duration-300 group ${activeTab === 'schedule' ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} href="#">
            <span className="material-icons group-hover:scale-110 transition-transform">calendar_today</span>
            <span className="text-[10px] font-medium mt-1">Schedule</span>
          </a>
          <a role="button" onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center p-2 rounded-xl w-16 transition-all duration-300 group ${activeTab === 'profile' ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} href="#">
            <span className="material-icons group-hover:scale-110 transition-transform">person</span>
            <span className="text-[10px] font-medium mt-1">Profile</span>
          </a>
        </div>
      </nav>

      <div className="fixed top-24 right-4 z-50">
        <button className="p-3 bg-surface-dark dark:bg-primary rounded-full shadow-lg text-white dark:text-surface-dark hover:scale-110 transition-transform" onClick={toggleDarkMode}>
          <span className="material-icons block dark:hidden">dark_mode</span>
          <span className="material-icons hidden dark:block">light_mode</span>
        </button>
      </div>
    </div >
  );
};

export default App;


