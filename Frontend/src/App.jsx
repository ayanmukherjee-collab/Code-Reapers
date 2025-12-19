import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './homepage.jsx'; 
import Faculty from './faculty.jsx'; 
import Buildings from './buildings.jsx';
import Events from './event.jsx';
import Profile from './profile.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* This tells the app: if the URL  is "/", show Home */}
        <Route path="/" element={<Home />} />
        
        {/* This tells the app: if the URL is "/faculty", show Faculty */}
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/buildings" element={<Buildings />} />
        <Route path="/events" element={<Events />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;