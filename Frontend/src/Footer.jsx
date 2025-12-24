import React, { useContext } from 'react'
import { ThemeContext } from './themeContext';
import { useLocation, useNavigate } from 'react-router-dom';

const Footer = () => {

    const { theme } = useContext(ThemeContext);
    const currentPath = useLocation().pathname;
    const navigate = useNavigate();


    return (
        <footer className={`fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center p-2 ${theme === 'dark' ? 'bg-black text-white border-t border-gray-700' : 'bg-white text-black border-t border-gray-200'} shadow-md`}>
            <div className={`flex flex-col items-center cursor-pointer ${currentPath === '/' ? 'text-black' : 'text-gray-400'}`} onClick={() => navigate('/')}>
                <i className="fas fa-home text-xl"></i>
                <span className="text-[10px] font-bold">Home</span>
            </div>

            <div className={`flex flex-col items-center cursor-pointer ${currentPath === '/map' ? 'text-black' : 'text-gray-400'}`} onClick={() => alert('Resources')}>
                <i className="fa-regular fa-map"></i>
                <span className="text-[10px] font-bold">Map</span>
            </div>

            <div className={`flex flex-col items-center cursor-pointer ${currentPath === '/alerts' ? 'text-black' : 'text-gray-400'}`} onClick={() => alert('Alerts')}>
                <i className="fas fa-bell text-xl"></i>
                <span className="text-[10px] font-bold">Alerts</span>
            </div>

            <div className={`flex flex-col items-center cursor-pointer ${currentPath === '/profile' ? 'text-black' : 'text-gray-400'}`} onClick={() => navigate('/profile')}>
                <i className="fas fa-user text-xl"></i>
                <span className="text-[10px] font-bold">Profile</span>
            </div>
        </footer>
    )
}

export default Footer
