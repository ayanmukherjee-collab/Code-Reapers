import React, { useState, useMemo, useRef, useEffect } from 'react';

function makeMockFaculty() {
  const departments = ['IT', 'CA', 'Electronics', 'BBA', 'Bcom'];
  const semesters = Array.from({ length: 8 }, (_, i) => `sem ${i + 1}`);
  const names = ['Priya Sharma','Amit Kumar','Rina Das','Sanjay Patel','Kavita Rao','Mohit Verma','Neha Singh','Vikram Joshi','Anjali Gupta','Rajesh Tiwari','Poonam Jain','Deepak Singh','Meera Patel','Suresh Kumar','Kiran Rao','Arun Verma','Sunita Singh','Manoj Joshi','Rekha Sharma','Vivek Kumar','Lata Das','Prakash Patel','Geeta Rao','Ravi Verma','Shanti Singh','Karan Joshi','Nisha Gupta','Amit Tiwari','Pallavi Jain','Rohit Singh','Komal Patel','Sandeep Kumar','Rashmi Rao','Ajay Verma','Kavita Singh','Vikas Joshi','Anita Gupta','Raj Tiwari','Priyanka Jain'];
  const roles = ['Professor','Associate Professor','Assistant Professor','Librarian','HOD','Staff'];
  const list = [];
  let id = 1;
  let nameIndex = 0;
  for (const dept of departments) {
    for (const sem of semesters) {
      for (let i=0;i<1;i++){
        const name = names[nameIndex++ % names.length];
        const role = roles[Math.floor(Math.random()*roles.length)];
        list.push({
          id: id++,
          name,
          role,
          department: dept,
          semester: sem,
          phone: `+91${Math.floor(900000000 + Math.random()*100000000)}`,
          email: `${name.split(' ')[0].toLowerCase()}@example.com`,
          cabin: `Near room ${100 + Math.floor(Math.random()*100)}`,
          timing: `${8 + Math.floor(Math.random()*5)}:00 AM - ${1 + Math.floor(Math.random()*5)}:00 PM`,
          avatar: ''
        });
      }
    }
  }
  return list;
}

export default function FacultyAdmin({ department: initialDept = 'IT', semester: initialSem = 'sem 1' }) {
  const allFaculty = useMemo(() => makeMockFaculty(), []);
  const [facultyList, setFacultyList] = useState(allFaculty);
  const [showDelete, setShowDelete] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [pictureOptionsOpen, setPictureOptionsOpen] = useState(false);
  const [viewImage, setViewImage] = useState(false);
  const [noImagePopup, setNoImagePopup] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDept, setFilterDept] = useState(initialDept);
  const [filterSem, setFilterSem] = useState(initialSem);
  const [search, setSearch] = useState('');
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [semDropdownOpen, setSemDropdownOpen] = useState(false);
  const [tempFilterDept, setTempFilterDept] = useState(initialDept);
  const [tempFilterSem, setTempFilterSem] = useState(initialSem);
  const [timeSet, setTimeSet] = useState(false);
  const semListRef = useRef(null);
  const filterRef = useRef(null);
  const deptCardRef = useRef(null);
  const semCardRef = useRef(null);
  const deptListRef = useRef(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState(''); // 'from' or 'to'
  const [fromTime, setFromTime] = useState({ hour: 8, minute: 0, ampm: 'AM' });
  const [toTime, setToTime] = useState({ hour: 12, minute: 30, ampm: 'PM' });
  const clockRef = useRef(null);
  const [activeTimePart, setActiveTimePart] = useState('hour');
  const [dragging, setDragging] = useState(null);

  const increaseHour = () => {
    const setter = timePickerTarget === 'from' ? setFromTime : setToTime;
    setter(prev => {
      const newHour = prev.hour < 12 ? prev.hour + 1 : prev.hour;
      return { ...prev, hour: newHour };
    });
  };

  const decreaseHour = () => {
    const setter = timePickerTarget === 'from' ? setFromTime : setToTime;
    setter(prev => {
      const newHour = prev.hour > 1 ? prev.hour - 1 : prev.hour;
      return { ...prev, hour: newHour };
    });
  };

  const increaseMinute = () => {
    const setter = timePickerTarget === 'from' ? setFromTime : setToTime;
    setter(prev => {
      const newMinute = prev.minute < 59 ? prev.minute + 1 : prev.minute;
      return { ...prev, minute: newMinute };
    });
  };

  const decreaseMinute = () => {
    const setter = timePickerTarget === 'from' ? setFromTime : setToTime;
    setter(prev => {
      const newMinute = prev.minute > 0 ? prev.minute - 1 : prev.minute;
      return { ...prev, minute: newMinute };
    });
  };

  const toggleAmpm = () => {
    const setter = timePickerTarget === 'from' ? setFromTime : setToTime;
    setter(prev => ({ ...prev, ampm: prev.ampm === 'AM' ? 'PM' : 'AM' }));
  };
  const departments = ['IT', 'CA', 'Electronics', 'BBA', 'Bcom'];
  const semesters = Array.from({ length: 8 }, (_, i) => `sem ${i + 1}`);

  const visibleList = facultyList.filter(f => {
    if (filterDept && f.department !== filterDept) return false;
    if (filterSem && f.semester !== filterSem) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openDelete = (id) => { setToDeleteId(id); setShowDelete(true); };
  const confirmDelete = () => {
    setFacultyList((arr) => arr.filter(x => x.id !== toDeleteId));
    setToDeleteId(null); setShowDelete(false);
  };

  const parseTiming = (timing) => {
    if (!timing) return { from: { hour: 12, minute: 0, ampm: 'AM' }, to: { hour: 12, minute: 0, ampm: 'PM' } };
    const parts = timing.split(' - ');
    const from = parseTime(parts[0]);
    const to = parseTime(parts[1]);
    return { from, to };
  };

  const parseTime = (timeStr) => {
    const [time, ampm] = timeStr.split(' ');
    const [hour, minute] = time.split(':').map(Number);
    return { hour, minute, ampm };
  };

  const openEdit = (item) => { 
    setEditing(item); 
    const times = parseTiming(item.timing);
    setFromTime(times.from);
    setToTime(times.to);
  };
  const saveEdit = (updated) => {
    if (!updated.name || !updated.role || !updated.phone || !updated.email || !updated.cabin || !updated.timing) return;
    setFacultyList((arr) => {
      const found = arr.findIndex(x => x.id === updated.id);
      if (found >= 0) {
        const copy = [...arr]; copy[found] = updated; return copy;
      }
      return [...arr, updated];
    });
    setEditing(null);
  };

  const applyFilter = () => { 
    setFilterDept(tempFilterDept);
    setFilterSem(tempFilterSem);
    setFilterOpen(false); 
  };

  const handleClockMouseDown = (e) => {
    if (!clockRef.current) return;
    setDragging(activeTimePart);
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    const normalizedAngle = angle < 0 ? angle + 360 : angle;
    setTimeFromAngle(normalizedAngle, activeTimePart);
  };

  const handleClockMouseMove = (e) => {
    if (!dragging || !clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    const normalizedAngle = angle < 0 ? angle + 360 : angle;
    setTimeFromAngle(normalizedAngle, dragging);
  };

  const handleClockClick = (e) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    const normalizedAngle = angle < 0 ? angle + 360 : angle;
    setTimeFromAngle(normalizedAngle, activeTimePart);
  };

  const setTimeFromAngle = (angle, type) => {
    if (type === 'hour') {
      const hour = Math.round(angle / 30) % 12;
      const actualHour = hour === 0 ? 12 : hour;
      if (timePickerTarget === 'from') {
        setFromTime(prev => ({ ...prev, hour: actualHour }));
      } else {
        setToTime(prev => ({ ...prev, hour: actualHour }));
      }
    } else if (type === 'minute') {
      const minute = Math.round(angle / 6) % 60;
      if (timePickerTarget === 'from') {
        setFromTime(prev => ({ ...prev, minute }));
      } else {
        setToTime(prev => ({ ...prev, minute }));
      }
    }
  };

  useEffect(() => {
    if (deptDropdownOpen && deptListRef.current) {
      const idx = departments.indexOf(filterDept);
      const group = Math.floor(Math.max(0, idx) / 4);
      const itemHeight = 40;
      deptListRef.current.scrollTop = group * itemHeight * 4;
    }
  }, [deptDropdownOpen, filterDept]);

  useEffect(() => {
    if (semDropdownOpen && semListRef.current) {
      const idx = semesters.indexOf(filterSem);
      const group = Math.floor(Math.max(0, idx) / 4);
      const itemHeight = 40;
      semListRef.current.scrollTop = group * itemHeight * 4;
    }
  }, [semDropdownOpen, filterSem]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
        setDeptDropdownOpen(false);
        setSemDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewImage = () => {
    if (editing.avatar) {
      setViewImage(true);
    } else {
      setNoImagePopup(true);
      setTimeout(() => setNoImagePopup(false), 1500);
    }
  };

  return (
    <div className="mt-4 relative">
      <div className="flex items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-green-700">check_circle</span>
          </div>
          <h2 className="text-lg font-semibold">Faculty & Staffs</h2>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 pb-3 border-b">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Search faculty or staff..."
            className="w-full pl-10 pr-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="relative">
          <button onClick={() => {
            if (!filterOpen) {
              setTempFilterDept(filterDept);
              setTempFilterSem(filterSem);
            }
            setFilterOpen(s=>!s);
          }} className="px-3 py-2 border rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined">tune</span>
          </button>

          {filterOpen && (
            <div ref={filterRef} className="absolute top-full right-0 mt-2 w-45 bg-white border shadow-lg rounded-xl shadow z-50 p-4">
              <div className="mb-3 relative">
                <div className="text-sm font-medium mb-1">Department</div>
                <button onClick={()=>{ setDeptDropdownOpen(d=>!d); setSemDropdownOpen(false); }} className="w-full text-left px-3 py-2 border rounded-md">{tempFilterDept}</button>

                {deptDropdownOpen && (
                  <div ref={deptListRef} className="absolute right-full top-12 mr-3 w-25 bg-white border rounded max-h-40 overflow-y-auto shadow z-50">
                    {departments.map(d => (
                      <button key={d} onClick={() => { setTempFilterDept(d); setDeptDropdownOpen(false); }} className={`w-full text-left px-3 py-2 ${tempFilterDept===d ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-3 relative">
                <div className="text-sm font-medium mb-1">Semester</div>
                <button onClick={()=>{ setSemDropdownOpen(s=>!s); setDeptDropdownOpen(false); }} className="w-full text-left px-3 py-2 border rounded-md">{tempFilterSem}</button>

                {semDropdownOpen && (
                  <div ref={semListRef} className="absolute right-full top-12 mr-3 w-25 bg-white border rounded max-h-40 overflow-y-auto shadow z-50">
                    {semesters.map(s => (
                      <button key={s} onClick={() => { setTempFilterSem(s); setSemDropdownOpen(false); }} className={`w-full text-left px-3 py-2 ${tempFilterSem===s ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button onClick={()=>setFilterOpen(false)} className="px-3 py-1 rounded border">Cancel</button>
                <button onClick={applyFilter} className="px-3 py-1 rounded bg-blue-600 text-white">Apply</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add faculty button */}
      <div className="mt-3">
        <button onClick={() => { setEditing({ id: Date.now(), name: '', role: '', department: filterDept, semester: filterSem, phone: '', email: '', cabin: '', timing: '', avatar: '' }); setTimeSet(false); }} className="px-3 py-2 bg-green-600 text-white rounded-md">+ Add Faculty</button>
      </div>

      <div className="mt-4 overflow-auto max-h-[60vh] pr-2">
        {visibleList.map(f => (
          <div key={f.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm flex flex-col">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold" style={{backgroundImage: f.avatar ? `url(${f.avatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center'}}>
                {!f.avatar && f.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
              </div>

              <div className="flex-1">
                <div className="text-lg font-semibold">{f.name}</div>
                <div className="text-sm text-gray-500 mt-1">{f.role}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => openEdit(f)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Edit</button>
              <button onClick={() => openDelete(f.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-xs w-full">
            <p className="text-lg font-bold mb-4">Are you sure?</p>
            <div className="flex justify-center gap-4">
              <button onClick={confirmDelete} className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium">Yes</button>
              <button onClick={()=>setShowDelete(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium">No</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50 pt-20">
          <div className="bg-white w-full max-w-2xl rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold" style={{backgroundImage: editing.avatar ? `url(${editing.avatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center'}}>
                  {!editing.avatar && editing.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                </div>
                <button onClick={() => setPictureOptionsOpen(!pictureOptionsOpen)} className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-xs">edit</span>
                </button>
                {pictureOptionsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-20 bg-white border rounded shadow z-10">
                    <button onClick={() => { setPictureOptionsOpen(false); handleViewImage(); }} className="w-full text-left px-2 py-1 hover:bg-gray-50">View</button>
                    <button onClick={() => { setPictureOptionsOpen(false); document.getElementById('avatar-input').click(); }} className="w-full text-left px-2 py-1 hover:bg-gray-50">Edit</button>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input id="e-name" defaultValue={editing.name} placeholder="Full name" className="w-full text-xl font-semibold border-b pb-1" />
                <input id="e-role" defaultValue={editing.role} placeholder="Role / Profession" className="w-full mt-2 text-sm text-gray-600 border-b pb-1" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <label className="text-xs">Phone number</label>
                <input defaultValue={editing.phone} id="e-phone" className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="text-xs">Email</label>
                <input defaultValue={editing.email} id="e-email" className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="text-xs">Cabin</label>
                <input defaultValue={editing.cabin} id="e-cabin" className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="text-xs">Stay at college</label>
                <div className="flex gap-2">
                  <button onClick={() => { setShowTimePicker(true); setTimePickerTarget('from'); }} className="flex-1 border rounded px-2 py-1 text-left">
                    {fromTime.hour}:{fromTime.minute.toString().padStart(2, '0')} {fromTime.ampm}
                  </button>
                  <span className="self-center">-</span>
                  <button onClick={() => { setShowTimePicker(true); setTimePickerTarget('to'); }} className="flex-1 border rounded px-2 py-1 text-left">
                    {toTime.hour}:{toTime.minute.toString().padStart(2, '0')} {toTime.ampm}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={()=>setEditing(null)} className="px-4 py-2 border rounded">Discard</button>
              <button onClick={()=>{
                const updated = {
                  ...editing,
                  name: document.getElementById('e-name').value,
                  role: document.getElementById('e-role').value,
                  phone: document.getElementById('e-phone').value,
                  email: document.getElementById('e-email').value,
                  cabin: document.getElementById('e-cabin').value,
                  timing: `${fromTime.hour}:${fromTime.minute.toString().padStart(2, '0')} ${fromTime.ampm} - ${toTime.hour}:${toTime.minute.toString().padStart(2, '0')} ${toTime.ampm}`,
                  avatar: editing.avatar
                };
                saveEdit(updated);
              }} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      <input type="file" id="avatar-input" accept="image/*" style={{display: 'none'}} onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setEditing({...editing, avatar: reader.result});
          };
          reader.readAsDataURL(file);
        }
      }} />

      {viewImage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setViewImage(false)}>
          <img src={editing.avatar || ''} className="max-w-full max-h-full" />
        </div>
      )}

      {noImagePopup && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-lg z-50">
          <p>No picture is uploaded yet</p>
        </div>
      )}

      {showTimePicker && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-72">
            <h3 className="text-lg font-semibold mb-4 text-center">Set Time</h3>
            <div className="flex justify-center mb-4">
              <svg
                ref={clockRef}
                width="160"
                height="160"
                viewBox="0 0 160 160"
                className="cursor-pointer"
                onMouseDown={(e) => handleClockMouseDown(e)}
                onMouseMove={(e) => dragging && handleClockMouseMove(e)}
                onMouseUp={() => setDragging(null)}
                onMouseLeave={() => setDragging(null)}
                onClick={(e) => handleClockClick(e)}
              >
                <circle cx="80" cy="80" r="75" fill="none" stroke="#d1d5db" strokeWidth="2" />
                {/* Minute markers */}
                {[...Array(60)].map((_, i) => {
                  const angle = (i * 6 - 90) * (Math.PI / 180);
                  const innerRadius = i % 5 === 0 ? 65 : 70;
                  const outerRadius = 75;
                  const x1 = 80 + innerRadius * Math.cos(angle);
                  const y1 = 80 + innerRadius * Math.sin(angle);
                  const x2 = 80 + outerRadius * Math.cos(angle);
                  const y2 = 80 + outerRadius * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#9ca3af"
                      strokeWidth={i % 5 === 0 ? "2" : "1"}
                    />
                  );
                })}
                {/* Hour numbers */}
                {[...Array(12)].map((_, i) => {
                  const hour = i === 0 ? 12 : i;
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const x = 80 + 65 * Math.cos(angle);
                  const y = 80 + 65 * Math.sin(angle);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="14"
                      fontWeight="bold"
                      fill="black"
                    >
                      {hour}
                    </text>
                  );
                })}
                {/* Hour hand */}
                <line
                  x1="80"
                  y1="80"
                  x2={80 + 35 * Math.cos(((timePickerTarget === 'from' ? fromTime.hour % 12 : toTime.hour % 12) * 30 + (timePickerTarget === 'from' ? fromTime.minute : toTime.minute) * 0.5 - 90) * (Math.PI / 180))}
                  y2={80 + 35 * Math.sin(((timePickerTarget === 'from' ? fromTime.hour % 12 : toTime.hour % 12) * 30 + (timePickerTarget === 'from' ? fromTime.minute : toTime.minute) * 0.5 - 90) * (Math.PI / 180))}
                  stroke="black"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Minute hand */}
                <line
                  x1="80"
                  y1="80"
                  x2={80 + 50 * Math.cos(((timePickerTarget === 'from' ? fromTime.minute : toTime.minute) * 6 - 90) * (Math.PI / 180))}
                  y2={80 + 50 * Math.sin(((timePickerTarget === 'from' ? fromTime.minute : toTime.minute) * 6 - 90) * (Math.PI / 180))}
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Center dot */}
                <circle cx="80" cy="80" r="4" fill="black" />
              </svg>
            </div>
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="flex flex-col items-center">
                <div className="text-xs font-medium mb-1">Hour</div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={timePickerTarget === 'from' ? fromTime.hour : toTime.hour}
                    readOnly
                    onClick={() => setActiveTimePart('hour')}
                    className="w-12 h-8 text-center border rounded"
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={increaseHour}
                      disabled={(timePickerTarget === 'from' ? fromTime.hour : toTime.hour) >= 12}
                      className="text-xs w-4 h-4 flex items-center justify-center border rounded disabled:opacity-50"
                    >
                      ▲
                    </button>
                    <button
                      onClick={decreaseHour}
                      disabled={(timePickerTarget === 'from' ? fromTime.hour : toTime.hour) <= 1}
                      className="text-xs w-4 h-4 flex items-center justify-center border rounded disabled:opacity-50"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
              <span className="text-xl">:</span>
              <div className="flex flex-col items-center">
                <div className="text-xs font-medium mb-1">Minute</div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={(timePickerTarget === 'from' ? fromTime.minute : toTime.minute).toString().padStart(2, '0')}
                    readOnly
                    onClick={() => setActiveTimePart('minute')}
                    className="w-12 h-8 text-center border rounded"
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={increaseMinute}
                      disabled={(timePickerTarget === 'from' ? fromTime.minute : toTime.minute) >= 59}
                      className="text-xs w-4 h-4 flex items-center justify-center border rounded disabled:opacity-50"
                    >
                      ▲
                    </button>
                    <button
                      onClick={decreaseMinute}
                      disabled={(timePickerTarget === 'from' ? fromTime.minute : toTime.minute) <= 0}
                      className="text-xs w-4 h-4 flex items-center justify-center border rounded disabled:opacity-50"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-xs font-medium mb-1">AM/PM</div>
                <button
                  onClick={toggleAmpm}
                  className="w-12 h-8 text-center border rounded"
                >
                  {timePickerTarget === 'from' ? fromTime.ampm : toTime.ampm}
                </button>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowTimePicker(false)} className="px-6 py-2 bg-red-600 text-white rounded font-semibold">Cancel</button>
              <button onClick={() => { setShowTimePicker(false); setTimeSet(true); }} className="px-6 py-2 bg-blue-600 text-white rounded font-semibold">Set Time</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}