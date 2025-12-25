import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../../config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
    // Auth state
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Organization state
    const [organization, setOrganization] = useState(null); // { name, type, positions, ... }
    const [organizationType, setOrganizationType] = useState(null); // Keep for UI compatibility for now

    // Mock data storage
    const [buildings, setBuildings] = useState([]);
    const [personnel, setPersonnel] = useState([]);

    // Auth functions
    const login = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // After login, we should check if user has an org
            await checkUserOrg(result.user.email);
            return result.user;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setOrganization(null);
            setOrganizationType(null);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const checkUserOrg = async (email) => {
        try {
            const docRef = doc(db, "organizations", email);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const org = docSnap.data();
                setOrganization(org);
                setOrganizationType(org.type);
            } else {
                setOrganization(null);
                setOrganizationType(null);
            }
        } catch (error) {
            console.error("Error checking org:", error);
            setOrganization(null);
            setOrganizationType(null);
        }
    };

    const createOrganization = async (orgData) => {
        try {
            if (!user?.email) throw new Error("No authenticated user found");

            const newOrg = {
                ...orgData,
                adminEmail: user.email,
                createdAt: new Date().toISOString()
            };

            await setDoc(doc(db, "organizations", user.email), newOrg);

            setOrganization(newOrg);
            setOrganizationType(newOrg.type);
            return newOrg;
        } catch (error) {
            console.error("Failed to create org:", error);
            throw error;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await checkUserOrg(currentUser.email);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const addBuilding = (building) => {
        setBuildings(prev => [...prev, { ...building, id: Date.now() }]);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        organization,
        organizationType, // derived from organization.type usually
        createOrganization,
        buildings,
        personnel,
        addBuilding
    };

    return (
        <AdminContext.Provider value={value}>
            {!loading && children}
        </AdminContext.Provider>
    );
};
