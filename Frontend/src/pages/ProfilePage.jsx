import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Button, Input } from '../components';
import { Settings, Shield, LogOut, Edit2, Save, X, Building2, Check, ChevronRight } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * ProfilePage Component
 * Features: View/Edit Profile, Settings, Admin Access, Change Organization
 */
const ProfilePage = () => {
    const { user, userProfile, updateProfile, settings, updateSettings, loading, logout } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    // Change Org State
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [orgList, setOrgList] = useState([]);
    const [loadingOrgs, setLoadingOrgs] = useState(false);
    const [selectedNewOrg, setSelectedNewOrg] = useState(null);
    const [selectedNewRole, setSelectedNewRole] = useState(null);
    const [orgStep, setOrgStep] = useState(1); // 1: Select Org, 2: Select Role

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return <div className="p-10 text-center">Please log in to view profile.</div>;

    const startEditing = () => {
        setEditForm({
            name: userProfile?.name || '',
            department: userProfile?.department || '',
            ...userProfile?.studentDetails
        });
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditForm({});
    };

    const handleSave = async () => {
        try {
            await updateProfile({
                name: editForm.name,
                department: editForm.department,
                studentDetails: userProfile?.role?.toLowerCase() === 'student' ? {
                    year: editForm.year,
                    semester: editForm.semester,
                    section: editForm.section,
                    rollNo: editForm.rollNo
                } : null
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to save changes.");
        }
    };

    // Change Org Logic
    const openOrgModal = async () => {
        setShowOrgModal(true);
        setLoadingOrgs(true);
        try {
            // Reusing fetch logic
            const querySnapshot = await getDocs(collection(db, "organizations"));
            const orgs = [];
            querySnapshot.forEach((doc) => {
                orgs.push({ id: doc.id, ...doc.data() });
            });
            setOrgList(orgs);
        } catch (e) {
            console.error("Error fetching orgs", e);
            // Fallback
            setOrgList([{
                id: 'demo_org',
                name: 'CampusConnect University',
                type: 'college',
                positions: ['Student', 'Faculty', 'Staff', 'Admin']
            }]);
        } finally {
            setLoadingOrgs(false);
        }
    };

    const handleOrgChangeSave = async () => {
        if (!selectedNewOrg || !selectedNewRole) return;
        try {
            await updateProfile({
                institution: selectedNewOrg.name,
                orgId: selectedNewOrg.id,
                orgType: selectedNewOrg.type,
                role: selectedNewRole
                // We keep the name/email/etc.
                // Reset student details if switching role to non-student?
                // For safety, let's keep them, or maybe clear them if role != student.
                // But simplified: just update core org info.
            });
            setShowOrgModal(false);
            setOrgStep(1);
            setSelectedNewOrg(null);
            setSelectedNewRole(null);
        } catch (e) {
            console.error("Failed to change org", e);
            alert("Failed to update organization.");
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-32 px-6 pt-20">

            {/* Profile Header */}
            <div className="flex flex-col items-center mb-12 relative">

                {/* Edit Toggle */}
                {!isEditing && (
                    <button
                        onClick={startEditing}
                        className="absolute top-0 right-0 p-3 bg-white rounded-full shadow-md text-gray-600 hover:text-black hover:scale-110 transition-all"
                    >
                        <Edit2 size={20} />
                    </button>
                )}

                <div className="w-32 h-32 bg-black rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-2xl mb-6 ring-8 ring-white">
                    {userProfile?.name?.charAt(0) || user.email?.charAt(0)}
                </div>

                {isEditing ? (
                    <div className="w-full max-w-sm space-y-4 animate-in fade-in zoom-in duration-300">
                        <Input
                            value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="Your Name"
                            className="text-center text-xl font-bold !bg-white border-2 border-black"
                        />
                        <Input
                            value={editForm.department}
                            onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                            placeholder="Department"
                            className="text-center text-sm !bg-white"
                        />
                    </div>
                ) : (
                    <>
                        <h1 className="text-display text-black text-center mb-1">{userProfile?.name || 'User'}</h1>
                        <span className="px-6 py-2 bg-gray-200 rounded-full text-sm font-extrabold uppercase tracking-widest text-gray-600">
                            {userProfile?.role || 'Guest'} &bull; {userProfile?.department || 'General'}
                        </span>
                    </>
                )}
            </div>

            {/* Student ID Card */}
            {userProfile?.role?.toLowerCase() === 'student' && (userProfile?.studentDetails || isEditing) && (
                <div className="bg-black text-white p-6 rounded-[32px] shadow-xl mb-8 relative overflow-hidden transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-800 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full"></div> Student Identity</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                        {isEditing ? (
                            <>
                                <div>
                                    <p className="text-gray-400 text-xs uppercase font-bold mb-1">Year</p>
                                    <input
                                        className="w-full bg-gray-800 rounded-lg p-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white"
                                        value={editForm.year || ''}
                                        onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                                        placeholder="Year"
                                    />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs uppercase font-bold mb-1">Semester</p>
                                    <input
                                        className="w-full bg-gray-800 rounded-lg p-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white"
                                        value={editForm.semester || ''}
                                        onChange={e => setEditForm({ ...editForm, semester: e.target.value })}
                                        placeholder="Sem"
                                    />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs uppercase font-bold mb-1">Roll No</p>
                                    <input
                                        className="w-full bg-gray-800 rounded-lg p-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white"
                                        value={editForm.rollNo || ''}
                                        onChange={e => setEditForm({ ...editForm, rollNo: e.target.value })}
                                        placeholder="Roll No"
                                    />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs uppercase font-bold mb-1">Section</p>
                                    <input
                                        className="w-full bg-gray-800 rounded-lg p-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white"
                                        value={editForm.section || ''}
                                        onChange={e => setEditForm({ ...editForm, section: e.target.value })}
                                        placeholder="Sec"
                                    />
                                </div>
                            </>
                        ) : (
                            userProfile.studentDetails && (
                                <>
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase font-bold">Year / Sem</p>
                                        <p className="font-medium text-lg">{userProfile.studentDetails.year} / {userProfile.studentDetails.semester}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase font-bold">Roll No</p>
                                        <p className="font-medium text-lg">{userProfile.studentDetails.rollNo}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-400 text-xs uppercase font-bold">Section</p>
                                        <p className="font-medium text-lg">{userProfile.studentDetails.section}</p>
                                    </div>
                                </>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Edit Actions */}
            {isEditing && (
                <div className="flex gap-4 mb-8">
                    <Button onClick={cancelEditing} variant="secondary" fullWidth icon={<X size={20} />}>Cancel</Button>
                    <Button onClick={handleSave} fullWidth icon={<Save size={20} />}>Save Changes</Button>
                </div>
            )}

            {/* Settings List */}
            <div className="space-y-4 mb-10">
                <h2 className="text-title text-black px-2">Settings</h2>

                {/* Change Organization Item */}
                <div
                    className="p-6 bg-white rounded-[32px] flex items-center justify-between shadow-sm active:scale-98 transition-transform cursor-pointer group"
                    onClick={openOrgModal}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-black">Change Campus</h3>
                            <p className="text-gray-500 font-medium mt-1">{userProfile?.institution || 'Select Organization'}</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                </div>

                {/* Toggle Item 1 */}
                <div
                    className="p-6 bg-white rounded-[32px] flex items-center justify-between shadow-sm active:scale-98 transition-transform cursor-pointer"
                    onClick={() => updateSettings('offlineMaps', !settings.offlineMaps)}
                >
                    <div>
                        <h3 className="text-xl font-bold text-black">Offline Maps</h3>
                        <p className="text-gray-500 font-medium mt-1">Download for use without WiFi</p>
                    </div>
                    <div className={`
               w-16 h-10 rounded-full p-1 transition-colors duration-300
               ${settings.offlineMaps ? 'bg-black' : 'bg-gray-200'}
            `}>
                        <div className={`
                  w-8 h-8 bg-white rounded-full shadow-md transform transition-transform duration-300
                  ${settings.offlineMaps ? 'translate-x-6' : 'translate-x-0'}
               `}></div>
                    </div>
                </div>

                {/* Toggle Item 2 */}
                <div
                    className="p-6 bg-white rounded-[32px] flex items-center justify-between shadow-sm active:scale-98 transition-transform cursor-pointer"
                    onClick={() => updateSettings('accessibilityMode', !settings.accessibilityMode)}
                >
                    <div>
                        <h3 className="text-xl font-bold text-black">Accessibility</h3>
                        <p className="text-gray-500 font-medium mt-1">Avoid stairs, prefer elevators</p>
                    </div>
                    <div className={`
               w-16 h-10 rounded-full p-1 transition-colors duration-300
               ${settings.accessibilityMode ? 'bg-black' : 'bg-gray-200'}
            `}>
                        <div className={`
                  w-8 h-8 bg-white rounded-full shadow-md transform transition-transform duration-300
                  ${settings.accessibilityMode ? 'translate-x-6' : 'translate-x-0'}
               `}></div>
                    </div>
                </div>
            </div>

            <Button
                fullWidth
                variant="primary"
                className="!h-16 text-lg mb-4 bg-black text-white hover:bg-gray-800"
                icon={<Shield size={24} />}
                onClick={() => window.location.href = '/admin'}
            >
                Switch to Admin View
            </Button>

            <Button fullWidth variant="secondary" onClick={logout} className="!h-16 text-lg" icon={<LogOut size={24} />}>
                Sign Out
            </Button>

            {/* Change Org Modal/Overlay */}
            {showOrgModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl relative">
                        <button
                            onClick={() => setShowOrgModal(false)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-bold text-black mb-2">
                            {orgStep === 1 ? 'Select Campus' : 'Select New Role'}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {orgStep === 1 ? 'Choose the organization you belong to.' : `What is your role at ${selectedNewOrg?.name}?`}
                        </p>

                        {orgStep === 1 ? (
                            <div className="space-y-3">
                                {loadingOrgs ? (
                                    <div className="text-center py-8">Loading...</div>
                                ) : (
                                    orgList.map(org => (
                                        <button
                                            key={org.id}
                                            onClick={() => {
                                                setSelectedNewOrg(org);
                                                setOrgStep(2);
                                            }}
                                            className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-black hover:bg-black hover:text-white text-left transition-all flex items-center justify-between group"
                                        >
                                            <span className="font-bold">{org.name}</span>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-white" />
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {selectedNewOrg?.positions?.map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setSelectedNewRole(role)}
                                            className={`
                                                px-4 py-2 rounded-xl font-bold border-2 transition-all
                                                ${selectedNewRole === role ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-100 hover:border-gray-200'}
                                            `}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <Button variant="secondary" onClick={() => setOrgStep(1)} fullWidth>Back</Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleOrgChangeSave}
                                        fullWidth
                                        disabled={!selectedNewRole}
                                        className="bg-black text-white"
                                    >
                                        Update
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProfilePage;
