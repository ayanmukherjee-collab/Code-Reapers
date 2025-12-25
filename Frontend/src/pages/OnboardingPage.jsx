import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Button, Input } from '../components';
import { ChevronRight, Check, User, Building2 } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { updateProfile } = useUser();
    const [step, setStep] = useState(1);
    const [organizations, setOrganizations] = useState([]);
    const [loadingOrgs, setLoadingOrgs] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        orgType: '',
        institution: '',
        department: '',
        year: '',
        semester: '',
        section: '',
        rollNo: ''
    });

    const [selectedOrg, setSelectedOrg] = useState(null);

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                // timeoutPromise to catch stalled requests
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timed out')), 5000)
                );

                const querySnapshot = await Promise.race([
                    getDocs(collection(db, "organizations")),
                    timeoutPromise
                ]);

                const orgs = [];
                querySnapshot.forEach((doc) => {
                    orgs.push({ id: doc.id, ...doc.data() });
                });
                setOrganizations(orgs);
            } catch (error) {
                console.error("Error fetching organizations:", error);
                // Fallback to dummy data so user isn't stuck
                console.warn("Using fallback dummy organization.");
                setOrganizations([{
                    id: 'demo_org',
                    name: 'CampusConnect University',
                    type: 'college',
                    positions: ['Student', 'Faculty', 'Staff', 'Admin']
                }]);
                // Still notify console but don't block UI
            } finally {
                setLoadingOrgs(false);
            }
        };

        fetchOrgs();
    }, []);

    const handleOrgSelect = (org) => {
        setSelectedOrg(org);
        setFormData({
            ...formData,
            institution: org.name,
            orgType: org.type,
            role: '' // Reset role when org changes
        });
    };

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else handleFinish();
    };

    const handleFinish = async () => {
        setError(null);
        try {
            await updateProfile({
                name: formData.name,
                role: formData.role.toLowerCase(),
                department: formData.department || 'General',
                institution: formData.institution,
                orgId: selectedOrg?.id || 'unknown',
                studentDetails: formData.role.toLowerCase() === 'student' ? {
                    year: formData.year,
                    semester: formData.semester,
                    section: formData.section,
                    rollNo: formData.rollNo
                } : null
            });
            navigate('/');
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
            if (error.code === 'permission-denied') {
                setError("Permission Denied: Please update your Firestore Security Rules in the Firebase Console.");
            } else {
                setError("Failed to save profile. Please try again.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col px-8 py-12 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-gray-50 rounded-full blur-3xl -z-10"></div>

            {/* Progress */}
            <div className="flex gap-2 mb-12">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= i ? 'bg-black' : 'bg-gray-100'}`}></div>
                ))}
            </div>

            {/* Step 1: Select Organization */}
            {step === 1 && (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
                    <h1 className="text-display text-black mb-2">Select Campus</h1>
                    <p className="text-gray-500 text-lg mb-8">Choose your organization to get started.</p>

                    {loadingOrgs ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 mb-4">
                            <p className="font-bold">Connection Error</p>
                            <p className="text-sm">{error}</p>
                            <button onClick={() => window.location.reload()} className="mt-2 text-sm underline font-semibold">Retry</button>
                        </div>
                    ) : (
                        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                            {organizations.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">No organizations found. Ask your admin to setup one.</div>
                            ) : (
                                organizations.map(org => (
                                    <button
                                        key={org.id}
                                        onClick={() => handleOrgSelect(org)}
                                        className={`
                                            w-full p-6 rounded-[24px] border-2 text-left transition-all duration-200
                                            ${selectedOrg?.id === org.id
                                                ? 'border-black bg-black text-white shadow-xl'
                                                : 'border-gray-100 bg-white hover:border-gray-200'}
                                        `}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-bold">{org.name}</h3>
                                            {selectedOrg?.id === org.id && <Check size={20} />}
                                        </div>
                                        <p className={`text-sm ${selectedOrg?.id === org.id ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {org.type.charAt(0).toUpperCase() + org.type.slice(1)} • {org.positions?.length || 0} Roles
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Identity & Role */}
            {step === 2 && (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
                    <h1 className="text-display text-black mb-2">Your Profile</h1>
                    <p className="text-gray-500 text-lg mb-8">Tell us about yourself at {formData.institution}.</p>

                    <div className="space-y-8">
                        <div>
                            <label className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2 block">Your Name</label>
                            <Input
                                placeholder="e.g. Alex Johnson"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                leadingIcon={<User size={24} />}
                                className="!bg-gray-50"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4 block">Select Your Role</label>
                            {selectedOrg?.positions && selectedOrg.positions.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {selectedOrg.positions.map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setFormData({ ...formData, role: role })}
                                            className={`
                                                px-6 py-3 rounded-xl font-bold text-sm
                                                transition-all duration-200 border-2
                                                ${formData.role === role
                                                    ? 'border-black bg-black text-white'
                                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}
                                            `}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-red-500 text-sm">No roles defined for this organization.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2.5: Student Details (Conditional) */}
            {step === 2 && formData.role.toLowerCase() === 'student' && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-bold mb-4">Student Details</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Department</label>
                            <Input
                                placeholder="e.g. Computer Science"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Year</label>
                            <Input
                                placeholder="e.g. 3rd"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Semester</label>
                            <Input
                                placeholder="e.g. 5th"
                                value={formData.semester}
                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Section</label>
                            <Input
                                placeholder="e.g. A"
                                value={formData.section}
                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Roll No</label>
                            <Input
                                placeholder="e.g. 64"
                                value={formData.rollNo}
                                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Finish */}
            {step === 3 && (
                <div className="flex-1 flex flex-col justify-center items-center text-center animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white mb-8 shadow-2xl">
                        <Check size={48} />
                    </div>
                    <h1 className="text-display text-black mb-4">You're All Set!</h1>
                    <p className="text-gray-500 text-lg max-w-[250px] mx-auto mb-4">
                        Welcome to {formData.institution}, {formData.name.split(' ')[0]}.
                    </p>
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="mt-auto pt-6">
                <Button
                    fullWidth
                    onClick={handleNext}
                    disabled={
                        (step === 1 && !selectedOrg) ||
                        (step === 2 && (!formData.name || !formData.role))
                    }
                >
                    {step === 3 ? "Let's Go" : "Continue"}
                    {step < 3 && <ChevronRight size={20} className="ml-2" />}
                </Button>
            </div>
        </div>
    );
};

export default OnboardingPage;
