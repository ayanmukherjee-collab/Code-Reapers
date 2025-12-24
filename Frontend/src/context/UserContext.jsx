import React, { createContext, useContext, useState } from 'react';
import { users } from '../data/dummyData';

/**
 * UserContext
 * Manages user role and profile for role-based UI
 */
const UserContext = createContext();

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
    // Available roles for demo
    const availableRoles = ['student', 'doctor', 'faculty'];

    // Default to student, check local storage for onboarding
    const [currentRole, setCurrentRole] = useState('student');
    const [user, setUser] = useState(users.student);
    const [hasOnboarded, setHasOnboarded] = useState(() => {
        return localStorage.getItem('campus_connect_onboarded') === 'true';
    });

    // Switch role (for demo purposes)
    const switchRole = (role) => {
        if (availableRoles.includes(role)) {
            setCurrentRole(role);
            setUser(users[role]);
        }
    };

    const updateProfile = (data) => {
        setUser(prev => ({ ...prev, ...data }));
        setHasOnboarded(true);
        localStorage.setItem('campus_connect_onboarded', 'true');
    };

    // Settings state
    const [settings, setSettings] = useState({
        offlineMaps: false,
        accessibilityMode: false,
    });

    const updateSettings = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const value = {
        user,
        currentRole,
        availableRoles,
        switchRole,
        hasOnboarded,
        updateProfile,
        settings,
        updateSettings,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
