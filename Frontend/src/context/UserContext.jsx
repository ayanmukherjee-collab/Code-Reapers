import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';

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
    // Auth & Profile state
    const [user, setUser] = useState(null); // Firebase Auth User
    const [userProfile, setUserProfile] = useState(null); // Firestore User Data
    const [loading, setLoading] = useState(true);

    // Auth functions
    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // Update profile in Firestore
    const updateProfile = async (data) => {
        if (!user) return;
        try {
            const profileData = { ...data, email: user.email, updatedAt: new Date().toISOString() };
            await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
            setUserProfile(prev => ({ ...prev, ...profileData }));
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    };

    useEffect(() => {
        // Auth Listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setUserProfile(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Profile Listener (runs when user changes)
        let unsubscribeProfile = () => { };

        if (user) {
            // setLoading(true); // Don't reset loading here to avoid flickers, just wait if initial load
            unsubscribeProfile = onSnapshot(doc(db, "users", user.uid),
                (docSnap) => {
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data());
                    } else {
                        setUserProfile(null); // Document doesn't exist -> Onboarding needed
                    }
                    setLoading(false);
                },
                (error) => {
                    console.error("Error fetching user profile:", error);
                    setLoading(false);
                }
            );
        }

        return () => unsubscribeProfile();
    }, [user]);

    // Global Failsafe (10s)
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading((prev) => {
                if (prev) console.warn("Auth/Profile timed out, forcing load.");
                return false;
            });
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const seedData = async () => {
            try {
                const orgsSnap = await getDocs(collection(db, "organizations"));
                if (orgsSnap.empty) {
                    console.log("Seeding dummy organization...");
                    const demoOrg = {
                        name: "CampusConnect University",
                        type: "college",
                        positions: ["Student", "Faculty", "Staff", "Admin"],
                        adminEmail: "admin@demo.com",
                        createdAt: new Date().toISOString()
                    };
                    await setDoc(doc(db, "organizations", "demo_org"), demoOrg);
                }
            } catch (error) {
                console.error("Seeding failed:", error);
            }
        };
        seedData();
    }, []);

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
        userProfile,
        loading,
        login,
        logout,
        hasOnboarded: !!userProfile, // Derived from profile existence
        updateProfile,
        settings,
        updateSettings,
    };

    return (
        <UserContext.Provider value={value}>
            {loading ? (
                <div className="h-screen w-screen flex items-center justify-center bg-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                </div>
            ) : (
                children
            )}
        </UserContext.Provider>
    );
};

export default UserContext;
