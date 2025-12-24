import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { Building2, Activity, Briefcase, Check } from 'lucide-react';

const OrgSetup = () => {
    const { selectTemplate, organizationType } = useAdmin();

    const options = [
        { id: 'college', label: 'College / University', icon: Building2, desc: 'Students, Faculty, Staff' },
        { id: 'hospital', label: 'Hospital / Clinic', icon: Activity, desc: 'Doctors, Nurses, Patients' },
        { id: 'business', label: 'Corporate Office', icon: Briefcase, desc: 'Employees, Managers, Clients' },
    ];

    return (
        <div className="max-w-4xl mx-auto pt-20">
            <h1 className="text-display text-black mb-4">Welcome, Admin.</h1>
            <p className="text-xl text-gray-500 mb-12">Select your campus identity to configure the dashboard.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => selectTemplate(opt.id)}
                        className={`
                   group relative p-8 rounded-[32px] border-2 text-left transition-all duration-300
                   ${organizationType === opt.id
                                ? 'border-black bg-black text-white shadow-2xl scale-105'
                                : 'border-white bg-white hover:border-gray-200 shadow-sm'}
                `}
                    >
                        <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mb-6
                    ${organizationType === opt.id ? 'bg-white/20' : 'bg-gray-50 text-black'}
                `}>
                            <opt.icon size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{opt.label}</h3>
                        <p className={`text-sm ${organizationType === opt.id ? 'text-gray-400' : 'text-gray-500'}`}>{opt.desc}</p>

                        {organizationType === opt.id && (
                            <div className="absolute top-6 right-6 w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">
                                <Check size={16} strokeWidth={4} />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default OrgSetup;
