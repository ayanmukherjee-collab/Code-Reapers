import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './themeContext.jsx';
import Footer from './Footer.jsx';

const FacultyPage = () => {
  const [activeTab, setActiveTab] = useState('Teachers');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSem, setSelectedSem] = useState('Sem 1');

  const scrollRef = useRef(null);
  const semesters = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];

  useEffect(() => {
    if (showDropdown && scrollRef.current) {
      const semNumber = parseInt(selectedSem.replace('Sem ', ''));
      if (semNumber > 4) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      } else {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [showDropdown, selectedSem]);

  const facultyData = [
    // --- SEMESTER 1 ---
    { id: 1, name: 'Dr. Anup', role: 'Professor, Physics', image: '/assets/anup.png', type: 'Teachers', sem: 'Sem 1', phone: '1234567890', email: 'anup@college.com', cabin: 'Room no. 203', timing: '11:00 AM - 2:00 PM' },
    { id: 2, name: 'Dr. Priya', role: 'Professor, Chemistry', image: '/assets/priya.png', type: 'Teachers', sem: 'Sem 1', phone: '9876543210', email: 'priya@college.com', cabin: 'Room no. 105', timing: '10:00 AM - 1:00 PM' },
    { id: 3, name: 'Mr. Vikram', role: 'Lecturer, English', image: '/assets/vikram.png', type: 'Teachers', sem: 'Sem 1', phone: '1122334455', email: 'vikram@college.com', cabin: 'Room no. 101', timing: '09:00 AM - 12:00 PM' },
    { id: 4, name: 'Mr. Suresh', role: 'Admin Office', image: '/assets/suresh.png', type: 'Staffs', sem: 'Sem 1', phone: '8877665544', email: 'suresh@admin.com', cabin: 'Reception Desk', timing: '09:00 AM - 5:00 PM' },
    { id: 5, name: 'Ms. Kavita', role: 'Data Entry', image: '/assets/kavita.png', type: 'Staffs', sem: 'Sem 1', phone: '7788990011', email: 'kavita@admin.com', cabin: 'Office A', timing: '10:00 AM - 4:00 PM' },

    // --- SEMESTER 2 ---
    { id: 6, name: 'Mr. Rahul', role: 'Professor, Mathematics', image: '/assets/rahul.png', type: 'Teachers', sem: 'Sem 2', phone: '1122334455', email: 'rahul@college.com', cabin: 'Room no. 302', timing: '12:00 PM - 3:00 PM' },
    { id: 7, name: 'Dr. Neha', role: 'Asst. Professor, EVS', image: '/assets/neha.png', type: 'Teachers', sem: 'Sem 2', phone: '2233445566', email: 'neha@college.com', cabin: 'Room no. 305', timing: '11:00 AM - 1:00 PM' },
    { id: 8, name: 'Mr. Sunil', role: 'Lecturer, Mechanics', image: '/assets/sunil.png', type: 'Teachers', sem: 'Sem 2', phone: '3344556677', email: 'sunil@college.com', cabin: 'Lab 1', timing: '02:00 PM - 4:00 PM' },
    { id: 9, name: 'Ms. Anita', role: 'Library Coordinator', image: '/assets/anita.png', type: 'Staffs', sem: 'Sem 2', phone: '7766554433', email: 'anita@lib.com', cabin: 'Library Floor 1', timing: '08:00 AM - 4:00 PM' },
    { id: 10, name: 'Mr. Rajesh', role: 'Office Asst.', image: '/assets/rajesh.png', type: 'Staffs', sem: 'Sem 2', phone: '6655443322', email: 'rajesh@admin.com', cabin: 'Reception', timing: '09:00 AM - 5:00 PM' },

    // --- SEMESTER 3 ---
    { id: 11, name: 'Dr. Sarah', role: 'Professor, Biology', image: '/assets/sarah.png', type: 'Teachers', sem: 'Sem 3', phone: '5566778899', email: 'sarah@college.com', cabin: 'Room no. 210', timing: '09:00 AM - 12:00 PM' },
    { id: 12, name: 'Mr. Kapil', role: 'Professor, Electronics', image: '/assets/kapil.png', type: 'Teachers', sem: 'Sem 3', phone: '6677889900', email: 'kapil@college.com', cabin: 'Room no. 215', timing: '10:00 AM - 1:00 PM' },
    { id: 13, name: 'Ms. Pooja', role: 'Asst. Prof, DS', image: '/assets/pooja.png', type: 'Teachers', sem: 'Sem 3', phone: '7788990011', email: 'pooja@college.com', cabin: 'Room no. 402', timing: '01:00 PM - 4:00 PM' },
    { id: 14, name: 'Mr. Aman', role: 'Technical Asst.', image: '/assets/aman.png', type: 'Staffs', sem: 'Sem 3', phone: '9988776655', email: 'aman@lab.com', cabin: 'Electronics Lab', timing: '09:00 AM - 4:00 PM' },

    // --- SEMESTER 4 ---
    { id: 15, name: 'Dr. Manoj', role: 'Professor, OS', image: '/assets/manoj.png', type: 'Teachers', sem: 'Sem 4', phone: '1212121212', email: 'manoj@college.com', cabin: 'Room no. 405', timing: '11:00 AM - 3:00 PM' },
    { id: 16, name: 'Ms. Deepa', role: 'Lecturer, Discrete Math', image: '/assets/deepa.png', type: 'Teachers', sem: 'Sem 4', phone: '2323232323', email: 'deepa@college.com', cabin: 'Room no. 408', timing: '09:00 AM - 11:00 AM' },
    { id: 17, name: 'Mr. Ravi', role: 'Lab Incharge', image: '/assets/ravi.png', type: 'Staffs', sem: 'Sem 4', phone: '3434343434', email: 'ravi@admin.com', cabin: 'CS Lab 2', timing: '10:00 AM - 5:00 PM' },

    // --- SEMESTER 5 ---
    { id: 18, name: 'Mr. Amit', role: 'Assistant Professor, CS', image: '/assets/amit.png', type: 'Teachers', sem: 'Sem 5', phone: '9900112233', email: 'amit@college.com', cabin: 'Room no. 401', timing: '02:00 PM - 5:00 PM' },
    { id: 19, name: 'Dr. Shalini', role: 'Professor, AI', image: '/assets/shalini.png', type: 'Teachers', sem: 'Sem 5', phone: '4545454545', email: 'shalini@college.com', cabin: 'Room no. 410', timing: '10:00 AM - 1:00 PM' },
    { id: 20, name: 'Mr. Rakesh', role: 'Lab Assistant', image: '/assets/rakesh.png', type: 'Staffs', sem: 'Sem 5', phone: '6655443322', email: 'rakesh@lab.com', cabin: 'Physics Lab', timing: '10:00 AM - 4:00 PM' },
    { id: 21, name: 'Ms. Meena', role: 'Accounts Dept.', image: '/assets/meena.png', type: 'Staffs', sem: 'Sem 5', phone: '5656565656', email: 'meena@admin.com', cabin: 'Finance Wing', timing: '09:00 AM - 4:00 PM' },

    // --- SEMESTER 6 ---
    { id: 22, name: 'Dr. Vivek', role: 'Professor, Networking', image: '/assets/vivek.png', type: 'Teachers', sem: 'Sem 6', phone: '6767676767', email: 'vivek@college.com', cabin: 'Room no. 501', timing: '09:00 AM - 12:00 PM' },
    { id: 23, name: 'Ms. Isha', role: 'Lecturer, Software Eng.', image: '/assets/isha.png', type: 'Teachers', sem: 'Sem 6', phone: '7878787878', email: 'isha@college.com', cabin: 'Room no. 504', timing: '12:00 PM - 3:00 PM' },
    { id: 24, name: 'Mr. Tarun', role: 'System Admin', image: '/assets/tarun.png', type: 'Staffs', sem: 'Sem 6', phone: '8989898989', email: 'tarun@it.com', cabin: 'Server Room', timing: '08:00 AM - 5:00 PM' },

    // --- SEMESTER 7 ---
    { id: 25, name: 'Dr. Raj', role: 'Professor, Project Mgmt', image: '/assets/raj.png', type: 'Teachers', sem: 'Sem 7', phone: '9090909090', email: 'raj@college.com', cabin: 'Room no. 601', timing: '11:00 AM - 2:00 PM' },
    { id: 26, name: 'Ms. Sneha', role: 'Asst. Prof, Cloud', image: '/assets/sneha.png', type: 'Teachers', sem: 'Sem 7', phone: '0101010101', email: 'sneha@college.com', cabin: 'Room no. 603', timing: '01:00 PM - 4:00 PM' },
    { id: 27, name: 'Mr. Karan', role: 'Placement Coord.', image: '/assets/karan.png', type: 'Staffs', sem: 'Sem 7', phone: '1213141516', email: 'karan@admin.com', cabin: 'Placement Cell', timing: '10:00 AM - 5:00 PM' },

    // --- SEMESTER 8 ---
    { id: 28, name: 'Dr. Gauri', role: 'Professor, Ethics', image: '/assets/gauri.png', type: 'Teachers', sem: 'Sem 8', phone: '2324252627', email: 'gauri@college.com', cabin: 'Room no. 605', timing: '10:00 AM - 12:00 PM' },
    { id: 29, name: 'Mr. Abhay', role: 'Mentor, Internships', image: '/assets/abhay.png', type: 'Teachers', sem: 'Sem 8', phone: '3435363738', email: 'abhay@college.com', cabin: 'Room no. 608', timing: '02:00 PM - 5:00 PM' },
    { id: 30, name: 'Ms. Ritu', role: 'Exams Head', image: '/assets/ritu.png', type: 'Staffs', sem: 'Sem 8', phone: '4546474849', email: 'ritu@admin.com', cabin: 'Exam Cell', timing: '09:00 AM - 4:00 PM' },
  ];

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() !== '') {
      const firstMatch = facultyData.find(person => 
        person.name.toLowerCase().includes(value.toLowerCase())
      );
      if (firstMatch && firstMatch.type !== activeTab) {
        setActiveTab(firstMatch.type);
      }
    }
  };

  const filteredData = facultyData.filter(person => 
    person.type === activeTab && 
    person.sem === selectedSem &&
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-800'} font-sans overflow-hidden relative`}>
      
      {showDropdown && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowDropdown(false)} />
      )}

      {selectedPerson && (
        <div className="absolute top-0 left-0 right-0 bottom-16 z-60 bg-white flex flex-col">
          <div className="p-4 flex items-center border-b border-gray-100">
            <button onClick={() => setSelectedPerson(null)} className="mr-4 text-xl active:opacity-50">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h1 className="font-bold text-lg">Profile Detail</h1>
          </div>

          <main className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-24 h-24 bg-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <img src={selectedPerson.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedPerson.name}</h2>
                <p className="text-gray-400">{selectedPerson.role}</p>
                <p className="text-blue-500 text-sm font-bold uppercase tracking-wide">{selectedPerson.sem}</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Contact', value: selectedPerson.phone },
                { label: 'Email', value: selectedPerson.email },
                { label: 'Cabin', value: `near ${selectedPerson.cabin}` },
                { label: 'Stay at College', value: selectedPerson.timing }
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                  <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">{item.label}</p>
                  <p className="font-medium text-gray-700">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button className="w-full bg-[#334155] text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform">
                <span>Navigation</span>
                <i className="fa-solid fa-circle-arrow-right"></i>
              </button>
            </div>
          </main>
        </div>
      )}

      <div className={`${theme === 'dark' ? 'bg-black' : 'bg-white'} shrink-0 shadow-md z-50 fixed top-0 left-0 right-0 border-b border-gray-100`}>
        <header className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">LocAlte <span className="text-xs font-normal text-gray-400 ml-1">{selectedSem}</span></h1>
        </header>

        <div className="p-4">
          <div className="relative flex items-center bg-gray-100 rounded-2xl px-4 py-2 mb-4">
            <span className="text-gray-400 mr-2"><i className="fa-solid fa-magnifying-glass"></i></span>
            <input 
              type="text" 
              placeholder={`Search in ${selectedSem}...`} 
              className="bg-transparent outline-none w-full text-sm" 
              value={searchTerm}
              onChange={handleSearch}
            />
            <div className="ml-3 pl-3 border-l border-gray-300 relative">
              <span 
                className="text-gray-400 text-lg cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
              >
                <i className="fa-solid fa-sliders"></i>
              </span>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-32 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div ref={scrollRef} className="max-h-48 overflow-y-auto scroll-smooth">
                    {semesters.map((sem, idx) => (
                      <div 
                        key={idx} 
                        className={`px-4 py-3 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-50 last:border-0 ${selectedSem === sem ? 'bg-gray-50 font-black text-black' : 'text-gray-600'}`} 
                        onClick={() => {
                          setSelectedSem(sem);
                          setShowDropdown(false);
                        }}
                      >
                        {sem}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`flex gap-4 p-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl`}>
            <button onClick={() => setActiveTab('Teachers')} className={`flex-1 py-2 rounded-xl font-bold transition-all ${activeTab === 'Teachers' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>Teachers</button>
            <button onClick={() => setActiveTab('Staffs')} className={`flex-1 py-2 rounded-xl font-bold transition-all ${activeTab === 'Staffs' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>Staffs</button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pt-28 pb-24">
        {filteredData.map((person) => (
          <div key={person.id} onClick={() => setSelectedPerson(person)} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-50 text-gray-800'} p-4 rounded-3xl shadow-sm border flex items-center space-x-4 cursor-pointer active:scale-95 transition-transform`}>
            <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0 overflow-hidden shadow-inner">
              <img src={person.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg leading-tight">{person.name}</h3>
              <p className="text-gray-400 text-sm">{person.role}</p>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="text-center py-20">
             <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'} mb-1 italic text-sm`}>No {activeTab} found for</p>
             <p className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'} font-bold text-lg`}>{selectedSem}</p>
          </div>
        )}
      </main>
        {/* FIXED FOOTER WITH LABELS */}
        <Footer />
    </div>
  );
};

export default FacultyPage;