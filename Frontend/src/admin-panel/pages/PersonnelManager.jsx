import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Users, Search, Filter, MoreHorizontal, UserPlus } from 'lucide-react';
import { Input } from '../../components';

const PersonnelManager = () => {
    const { personnel } = useAdmin(); // Assuming personnel is a list of users
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All');

    // Mock data if empty
    const displayPersonnel = personnel.length > 0 ? personnel : [
        { id: 1, name: 'John Doe', role: 'Professor', department: 'Computer Science', email: 'john@example.com', status: 'Active' },
        { id: 2, name: 'Jane Smith', role: 'Staff', department: 'Administration', email: 'jane@example.com', status: 'On Leave' },
        { id: 3, name: 'Dr. Emily Brown', role: 'Doctor', department: 'Cardiology', email: 'emily@hospital.com', status: 'Active' },
    ];

    const filtered = displayPersonnel.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'All' || p.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const roles = ['All', ...new Set(displayPersonnel.map(p => p.role))];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-black">Personnel Manager</h1>
                    <p className="text-gray-500 mt-1">Manage staff, faculty, and user roles.</p>
                </div>
                <button
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl"
                >
                    <UserPlus size={20} />
                    Add Member
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search by name or email..."
                        leadingIcon={<Search size={20} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {roles.map(role => (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`
                                px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-colors
                                ${filterRole === role ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}
                            `}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name / Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((person) => (
                                <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                {person.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-black">{person.name}</div>
                                                <div className="text-sm text-gray-400">{person.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600 inline-block">
                                            {person.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                        {person.department}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`
                                            px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1
                                            ${person.status === 'Active' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}
                                        `}>
                                            <span className={`w-2 h-2 rounded-full ${person.status === 'Active' ? 'bg-white' : 'bg-gray-400'}`}></span>
                                            {person.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-black">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="text-center py-10 text-gray-400">No personnel found.</div>
                )}
            </div>
        </div>
    );
};

export default PersonnelManager;
