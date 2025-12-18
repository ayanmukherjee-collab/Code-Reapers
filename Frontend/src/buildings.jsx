import React, { useState } from 'react';

const ChooseBuild = () => {
  const colleges = [
    { name: 'DSPMU', image: '/assets/dspmu.png' },
    { name: 'IITDdelhi', image: '/assets/delhi.png' },
    { name: 'IIT kgp', image: '/assets/kgp.png' },
    { name: 'IIT Roorkee', image: '/assets/roorkee.png' },
    { name: 'IIT hyderabad', image: '/assets/hyd.png' },
  ];

  const [selectedCollege, setSelectedCollege] = useState(colleges[0]);
  const [roomNumber, setRoomNumber] = useState('');
  const [department, setDepartment] = useState('');

  const handleCollegeChange = (event) => {
    const filteredCollege = colleges.find((college) => college.name === event.target.value);
    if (filteredCollege) {
      setSelectedCollege(filteredCollege);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="flex items-center justify-between p-4 bg-white shadow-md">
        <h1 className="text-xl font-bold">LocAlte</h1>
      </header>

      <main className="flex flex-col items-center p-4">
        <h2 className="text-lg font-bold mb-4">Choose Building:</h2>
        <select
          className="border border-gray-300 rounded-md px-2 py-1.5 w-60 mb-4 text-sm"
          value={selectedCollege.name}
          onChange={handleCollegeChange}
        >
          {colleges.map((college) => (
            <option key={college.name} value={college.name}>
              {college.name}
            </option>
          ))}
        </select>

        <img
          src={selectedCollege.image}
          alt={selectedCollege.name}
          className="w-70 h-70 object-cover rounded-lg mb-4 border-3 border-gray-500 p-1"
        />

        <div className="grid grid-cols-2 gap-4 w-full mb-4">
          <div className="border border-gray-300 rounded-md p-2 h-20 flex flex-col justify-center">
            <span className="text-sm text-gray-500">Room No</span>
            <input
              type="text"
              className="border-none outline-none text-lg"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />
          </div>
          <div className="border border-gray-300 rounded-md p-2 h-20 flex flex-col justify-center">
            <span className="text-sm text-gray-500">Department</span>
            <input
              type="text"
              className="border-none outline-none text-lg"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
        </div>

        <button className="w-full bg-black text-white py-3 rounded-md flex items-center justify-center">
          <span className="mr-2">Navigate</span>
          <i className="fas fa-arrow-right"></i>
        </button>
      </main>

      <footer className="flex justify-around items-center p-4 bg-white shadow-md mt-auto">
        <div className="text-xl cursor-pointer">
          <i className="fas fa-home"></i>
        </div>
        <div className="text-xl cursor-pointer">
          <i className="fas fa-folder"></i>
        </div>
        <div className="text-xl cursor-pointer">
          <i className="fas fa-bell"></i>
        </div>
        <div className="text-xl cursor-pointer">
          <i className="fas fa-user"></i>
        </div>
      </footer>
    </div>
  );
};

export default ChooseBuild;