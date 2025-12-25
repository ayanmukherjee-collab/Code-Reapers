import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorContent } from '../../data/dummyData';
import { Bell, MapPin, ArrowRight, Navigation, CheckCircle, Clock } from 'lucide-react';

const DoctorDashboard = ({ user, userProfile }) => {
    const navigate = useNavigate();
    const [isAvailable, setIsAvailable] = useState(true);

    const upcomingDuties = [
        { id: 1, title: 'Check Ward 4C', time: '10:30 AM', location: 'Floor 4' },
        { id: 2, title: 'Consultation: Dr. Smith', time: '11:15 AM', location: 'Room 202' },
        { id: 3, title: 'Lab Results Review', time: '12:00 PM', location: 'Lab B' },
    ];

    return (
        <main className="space-y-8 pt-8 px-6 animate-in fade-in duration-500">

            {/* Status Toggle (Visual only for now) */}
            <div className="flex justify-end -mt-4 mb-4">
                <button
                    onClick={() => setIsAvailable(!isAvailable)}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                        ${isAvailable ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}
                    `}
                >
                    <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    {isAvailable ? 'Available' : 'Busy'}
                </button>
            </div>

            {/* Hero Card: Immediate Destination */}
            <div className="relative overflow-hidden bg-black text-white p-8 rounded-[40px] shadow-2xl">
                {/* Abstract Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800 rounded-full blur-3xl -mr-20 -mt-20 opacity-30 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-gray-400 font-medium text-sm uppercase tracking-widest mb-4">
                        <Navigation size={16} />
                        Immediate Destination
                    </div>
                    <h2 className="text-4xl font-bold mb-2">Ward 4, Bed 10</h2>
                    <p className="text-gray-400 mb-8 max-w-[200px]">Patient needs urgent consultation regarding dosage.</p>

                    <button
                        onClick={() => navigate('/map')}
                        className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        Navigate Now
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            {/* Task Timeline */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-black tracking-tight">Upcoming Duties</h2>
                    <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">Today</span>
                </div>

                <div className="space-y-4 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-100 -z-10"></div>

                    {upcomingDuties.map((duty, idx) => (
                        <div key={duty.id} className="flex items-center gap-4 group">
                            <div className="w-16 flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-black ring-4 ring-white"></div>
                                <span className="text-xs font-bold text-gray-400 mt-2">{duty.time.split(' ')[0]}</span>
                            </div>

                            <div className="flex-1 bg-white p-5 rounded-[24px] border border-gray-50 shadow-sm flex items-center justify-between group-hover:shadow-md transition-shadow">
                                <div>
                                    <h4 className="font-bold text-black text-lg">{duty.title}</h4>
                                    <p className="text-gray-400 text-sm font-medium">{duty.location}</p>
                                </div>
                                <button
                                    onClick={() => navigate('/map')}
                                    className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors"
                                >
                                    <MapPin size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Updates Feed (Minimal) */}
            <section className="pt-4">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-2xl font-bold text-black tracking-tight">Updates</h2>
                    <Bell size={24} className="text-black" />
                </div>
                <div className="p-6 bg-white rounded-[32px] shadow-sm border border-gray-50 flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-2xl">
                        <Clock size={24} className="text-black" />
                    </div>
                    <div>
                        <h3 className="font-bold text-black text-lg">Shift Change</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mt-1">
                            Your night shift schedule for next week has been confirmed.
                        </p>
                    </div>
                </div>
            </section>

        </main>
    );
};

export default DoctorDashboard;
