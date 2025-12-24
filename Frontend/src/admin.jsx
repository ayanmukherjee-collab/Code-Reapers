import React, { useState, useRef, useEffect } from 'react';
import MapEditor from './mapeditor.jsx';
import FloorPlans from './floorplans.jsx';
import AdminEvents from './adminevents.jsx';
import FacultyAdmin from './facultyadmin.jsx';
import Scheduling from './scheduling.jsx';

export default function Admin() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeLight, setThemeLight] = useState(true);
  const [selected, setSelected] = useState('Map editor');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [buildings, setBuildings] = useState([]);

  const options = [
    'Map editor',
    'Floor plans',
    'Events',
    'Faculty and staffs',
    'Time scheduling',
  ];

  // Map editor state moved into MapEditor component
  // Faculty dropdown state
  const departments = ['IT', 'CA', 'Electronics', 'BBA', 'Bcom'];
  const semesters = Array.from({ length: 8 }, (_, i) => `sem ${i + 1}`);
  const [deptOpen, setDeptOpen] = useState(false);
  const [semOpen, setSemOpen] = useState(false);
  const [department, setDepartment] = useState(departments[0]);
  const [semester, setSemester] = useState(semesters[0]);
  const semListRef = useRef(null);

  const [facultyPanelOpen, setFacultyPanelOpen] = useState(false);
  const [fullScreenFaculty, setFullScreenFaculty] = useState(false);

  useEffect(() => {
    // when semester dropdown opens or selected semester changes, ensure selected group of 4 is visible
    if (semOpen && semListRef.current) {
      const idx = semesters.indexOf(semester);
      const group = Math.floor(idx / 4);
      const itemHeight = 40; // approx px per item (tailwind h-10 = 40px)
      semListRef.current.scrollTop = group * itemHeight * 4;
    }
  }, [semOpen, semester, semesters]);

  return (
    <div className={`${themeLight ? 'bg-white text-black' : 'bg-gray-900 text-white'} min-h-screen relative`}>      
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 h-14 flex items-center px-4 z-40 ${themeLight ? 'bg-white' : 'bg-gray-800'} border-b`}>        
        <button
          aria-label="Open menu"
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-2 rounded-md"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="flex-1 text-center font-semibold">Admin Panel</div>

        <button
          aria-label="Toggle theme"
          onClick={() => setThemeLight((t) => !t)}
          className="p-2 rounded-md"
        >
          {themeLight ? (
            <span className="material-symbols-outlined">wb_sunny</span>
          ) : (
            <span className="material-symbols-outlined">dark_mode</span>
          )}
        </button>
      </header>

      {/* Sidebar overlay */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 bg-black/30 z-30 transition-opacity ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white z-40 transform transition-transform shadow-lg ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-14 flex items-center px-4 border-b">Menu</div>
        <nav className="p-4 space-y-2">
          {options.map((opt) => {
            if (opt === 'Faculty and staffs') {
              return (
                <div key={opt}>
                  <button
                    onClick={() => {
                      // toggle the faculty panel inside sidebar
                      setFacultyPanelOpen((s) => !s);
                      // keep sidebar open when opening faculty panel
                      setSidebarOpen(true);
                      // do NOT change `selected` here — keep previous main panel visible
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 ${selected === opt ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                    <span className="flex-1">{opt}</span>
                    {/* <span className="material-symbols-outlined">${'expand_more'}</span> */}
                  </button>

                  {facultyPanelOpen && (
                    <div className="mt-2 pl-4 pr-2 pb-3 space-y-3">
                      {/* Department dropdown inside sidebar */}
                      <div>
                        <div className="text-xs font-medium mb-1">Department</div>
                        <div className="relative">
                          <button
                            onClick={() => { setDeptOpen((s) => !s); setSemOpen(false); }}
                            className="w-full text-left px-3 py-2 border rounded-md flex items-center justify-between bg-white"
                          >
                            <span>{department}</span>
                            <span className="material-symbols-outlined">expand_more</span>
                          </button>
                          {deptOpen && (
                            <div className="mt-1 border rounded-md bg-white max-h-48 overflow-auto z-30 shadow-md">
                              {departments.map((d) => (
                                <button
                                  key={d}
                                  onClick={() => { setDepartment(d); setDeptOpen(false); }}
                                  className={`w-full text-left px-3 py-2 ${department === d ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}`}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Semester dropdown inside sidebar */}
                      <div>
                        <div className="text-xs font-medium mb-1">Semester</div>
                        <div className="relative">
                          <button
                            onClick={() => { setSemOpen((s) => !s); setDeptOpen(false); }}
                            className="w-full text-left px-3 py-2 border rounded-md flex items-center justify-between bg-white"
                          >
                            <span>{semester}</span>
                            <span className="material-symbols-outlined">expand_more</span>
                          </button>
                          {semOpen && (
                            <div className="mt-1 border rounded-md bg-white max-h-40 overflow-y-auto z-30 shadow-md" ref={semListRef}>
                              {semesters.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => { setSemester(s); setSemOpen(false); }}
                                  className={`w-full text-left px-3 py-2 ${semester === s ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          onClick={() => { setSelected('FacultyAdmin'); setSidebarOpen(false); setFacultyPanelOpen(false); }}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded-md"
                        >
                          GO
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={opt}
                onClick={() => {
                  setSelected(opt);
                  setSidebarOpen(false);
                  setFacultyPanelOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 ${selected === opt ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <span className="material-symbols-outlined">chevron_right</span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <main className="pt-16 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {selected === 'Map editor' && <MapEditor />}
          {selected === 'Floor plans' && <FloorPlans />}
          {selected === 'Events' && <AdminEvents />}
          {selected === 'Time scheduling' && <Scheduling />}
          {selected === 'FacultyAdmin' && <FacultyAdmin department={department} semester={semester} />}
          {selected !== 'Map editor' && selected !== 'Floor plans' && selected !== 'Events' && selected !== 'Time scheduling' && selected !== 'FacultyAdmin' && (
            <section className="mt-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Selected</div>
                  <div className="text-xl font-semibold">{selected}</div>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-lg ${themeLight ? 'bg-gray-50' : 'bg-gray-800'}`}>
                <div className="text-sm text-gray-600">Configuration area for:</div>
                <div className="mt-2 text-lg font-medium">{selected}</div>
                <div className="mt-4 text-sm text-gray-500">Use this area to show controls and options related to the selected admin tool.</div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modal: add / edit building */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowModal(false)}></div>
          <div className={`bg-white rounded-md p-4 z-50 w-full max-w-lg ${themeLight ? '' : 'bg-gray-800 text-white'}`}>
            <h3 className="text-lg font-semibold">{editing && editing.id ? 'Edit Building' : 'Add Building'}</h3>
            <div className="mt-3 space-y-2">
              <label className="block text-sm">Name</label>
              <input className="w-full rounded-md border px-2 py-1" defaultValue={editing?.name || ''} id="b-name" />
              <label className="block text-sm">Floors</label>
              <input className="w-full rounded-md border px-2 py-1" defaultValue={editing?.floors || 1} id="b-floors" />
              <label className="block text-sm">Address</label>
              <input className="w-full rounded-md border px-2 py-1" defaultValue={editing?.address || ''} id="b-address" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-3 py-1 rounded-md">Cancel</button>
              <button
                onClick={() => {
                  const name = document.getElementById('b-name').value || 'Untitled';
                  const floors = Number(document.getElementById('b-floors').value) || 1;
                  const address = document.getElementById('b-address').value || '';
                  if (editing && editing.id) {
                    setBuildings((arr) => arr.map((x) => (x.id === editing.id ? { ...x, name, floors, address } : x)));
                  } else {
                    setBuildings((arr) => [...arr, { id: Date.now(), name, floors, address, status: 'Active' }]);
                  }
                  setShowModal(false);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full screen faculty view removed — faculty opens in-panel or via selected component */}

      {/* Footer */}
      <footer className={`fixed bottom-0 left-0 right-0 h-16 border-t ${themeLight ? 'bg-white' : 'bg-gray-800'} flex items-center justify-around z-40`}>        
        <button className="flex flex-col items-center text-sm text-gray-600">
          <span className="material-symbols-outlined">home</span>
          <span className="text-xs">Home</span>
        </button>

        <button className="flex flex-col items-center text-sm text-gray-600">
          <span className="material-symbols-outlined">message</span>
          <span className="text-xs">Msg</span>
        </button>

        <button className="flex flex-col items-center text-sm text-gray-600">
          <span className="material-symbols-outlined">notifications</span>
          <span className="text-xs">Alerts</span>
        </button>

        <button className="flex flex-col items-center text-sm text-gray-600">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-xs">Settings</span>
        </button>
      </footer>
    </div>
  );
}
