import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../../config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useUser } from '../../context/UserContext';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
    const { userProfile } = useUser();
    // Auth state
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Organization state
    const [organization, setOrganization] = useState(null); // Current active org
    const [organizationType, setOrganizationType] = useState(null);
    const [managedOrgs, setManagedOrgs] = useState([]); // List of orgs user can manage

    // Mock data storage
    const [buildings, setBuildings] = useState([]);
    const [personnel, setPersonnel] = useState([]);

    // Auth functions
    const login = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // checkUserOrg will be triggered by auth listener or userProfile change
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
            setManagedOrgs([]);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // Load Organization Logic
    useEffect(() => {
        const loadOrgData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch User's Managed Organizations (where they are admin)
                const orgsQuery = query(collection(db, "organizations"), where("adminEmail", "==", user.email));
                const orgsSnap = await getDocs(orgsQuery);
                const ownedOrgs = orgsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setManagedOrgs(ownedOrgs);

                let targetOrgId = null;

                // 2. Determine Initial Organization
                // Priority A: The organization from their user profile (Member/Student/Staff role)
                if (userProfile?.orgId && userProfile.orgId !== 'unknown') {
                    targetOrgId = userProfile.orgId;
                }
                // Priority B: If no profile org, but they own orgs, pick the first one
                else if (ownedOrgs.length > 0) {
                    targetOrgId = ownedOrgs[0].id;
                }
                // Priority C: Legacy check (doc id == email)
                else {
                    const docRef = doc(db, "organizations", user.email);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const legacyOrg = { id: docSnap.id, ...docSnap.data() };
                        setManagedOrgs(prev => [...prev.filter(o => o.id !== legacyOrg.id), legacyOrg]); // Add to managed if not there
                        targetOrgId = legacyOrg.id;
                    }
                }

                // 3. Set Active Organization
                if (targetOrgId) {
                    // Check if we already have the data in ownedOrgs
                    const preloaded = ownedOrgs.find(o => o.id === targetOrgId);
                    if (preloaded) {
                        setOrganization(preloaded);
                        setOrganizationType(preloaded.type);
                    } else {
                        // Fetch if not in owned list (e.g. they are member but not adminEmail, but we want to show it)
                        const orgRef = doc(db, "organizations", targetOrgId);
                        const orgSnap = await getDoc(orgRef);
                        if (orgSnap.exists()) {
                            const orgData = { id: orgSnap.id, ...orgSnap.data() };
                            setOrganization(orgData);
                            setOrganizationType(orgData.type);
                            // Also add to managed list so they can switch back to it easily? 
                            // Or maybe keep managedOrgs strictly for "Admin Rights".
                            // For now, let's assume if they can see it here, they can "manage" it or view it.
                        }
                    }
                } else {
                    setOrganization(null);
                    setOrganizationType(null);
                }

            } catch (error) {
                console.error("Error loading admin orgs:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadOrgData();
        }
    }, [user, userProfile]);

    const switchOrganization = async (orgId) => {
        // Find in managed list first
        const target = managedOrgs.find(o => o.id === orgId);
        if (target) {
            setOrganization(target);
            setOrganizationType(target.type);
        } else {
            // Fetch if not available locally
            try {
                const orgRef = doc(db, "organizations", orgId);
                const orgSnap = await getDoc(orgRef);
                if (orgSnap.exists()) {
                    const orgData = { id: orgSnap.id, ...orgSnap.data() };
                    setOrganization(orgData);
                    setOrganizationType(orgData.type);
                }
            } catch (e) {
                console.error("Failed to switch org", e);
            }
        }
    };

    const createOrganization = async (orgData) => {
        try {
            if (!user?.email) throw new Error("No authenticated user found");

            // Use a unique ID or email? User wants to create *another* one.
            // Using email as ID limits to 1 org per user. 
            // Better to use random ID for new orgs, or name-based.
            // Keeping legacy: checking if user already has one with email ID.

            // Proposal: Generate a new ID for the new organization
            const newOrgRef = doc(collection(db, "organizations")); // Auto-ID

            const newOrg = {
                ...orgData,
                adminEmail: user.email,
                createdAt: new Date().toISOString()
            };

            await setDoc(newOrgRef, newOrg);
            const createdOrg = { id: newOrgRef.id, ...newOrg };

            setManagedOrgs(prev => [...prev, createdOrg]);
            setOrganization(createdOrg);
            setOrganizationType(newOrg.type);

            return createdOrg;
        } catch (error) {
            console.error("Failed to create org:", error);
            throw error;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setLoading(false);
                setOrganization(null);
                setManagedOrgs([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Load Buildings when Organization set
    useEffect(() => {
        const fetchBuildings = async () => {
            if (organization?.id) {
                try {
                    const q = query(collection(db, "buildings"), where("orgId", "==", organization.id));
                    const querySnapshot = await getDocs(q);
                    const buildingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Sort by createdAt descending or name? Let's sort by date created usually.
                    // buildingsData.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setBuildings(buildingsData);
                } catch (error) {
                    console.error("Error fetching buildings:", error);
                }
            } else {
                setBuildings([]);
            }
        };
        fetchBuildings();
    }, [organization]);

    const addBuilding = async (buildingData) => {
        if (!organization?.id) {
            console.error("No organization selected");
            return;
        }

        try {
            const newBuilding = {
                ...buildingData,
                orgId: organization.id,
                orgName: organization.name, // denormalize for easier access if needed
                createdAt: new Date().toISOString(),
                floors: parseInt(buildingData.floors) || 1
            };
            const docRef = await addDoc(collection(db, "buildings"), newBuilding);
            setBuildings(prev => [...prev, { id: docRef.id, ...newBuilding }]);
            return docRef.id;
        } catch (error) {
            console.error("Error adding building:", error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        organization,
        organizationType,
        managedOrgs,
        switchOrganization,
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
