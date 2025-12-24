import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { studentContent, doctorContent } from '../data/dummyData';
import { Button } from '../components';
import { Clock, MapPin, Navigation, CheckCircle } from 'lucide-react';

/**
 * SchedulePage Component - Radical Redesign
 * Immersive Timeline, Massive Cards
 */
const SchedulePage = () => {
    const navigate = useNavigate();
    const { currentRole } = useUser();
    const content = currentRole === 'doctor' ? doctorContent : studentContent;

    const currentItem = content.schedule.find(s => s.status === 'current');

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-32 pt-20 px-6">

            {/* Header */}
            <div className="mb-10">
                <h1 className="text-display text-black mb-2">My Schedule</h1>
                <p className="text-body text-gray-500 font-medium">Wednesday, Dec 24</p>
            </div>

            {/* Current Task - Hero Card */}
            {currentItem && (
                <div className="mb-12">
                    <div className="bg-black text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Clock size={120} />
                        </div>

                        <div className="relative z-10">
                            <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-bold uppercase tracking-wide mb-6 inline-block">
                                Happening Now
                            </span>
                            <h2 className="text-3xl font-extraBold mb-2 leading-tight">{currentItem.title}</h2>
                            <div className="flex items-center gap-3 text-gray-300 mb-8">
                                <MapPin size={20} />
                                <span className="text-lg font-medium">{currentItem.location}</span>
                            </div>

                            <Button
                                fullWidth
                                variant="secondary"
                                className="!bg-white !text-black !border-none h-16 text-lg"
                                onClick={() => navigate('/map')}
                                icon={<Navigation size={24} />}
                            >
                                Navigate Now
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="ml-4 space-y-12 border-l-4 border-gray-200 pl-12 relative">
                {content.schedule.map((item) => {
                    if (item.status === 'current') return null; // Skip current as it's shown above

                    const isPast = item.status === 'past';

                    return (
                        <div key={item.id} className="relative">
                            {/* Node */}
                            <div className={`
                   absolute -left-[60px] top-6 w-8 h-8 rounded-full border-4 border-white shadow-sm
                   ${isPast ? 'bg-gray-300' : 'bg-black'}
                `}></div>

                            <div className={`
                   p-6 rounded-[32px] 
                   ${isPast ? 'bg-gray-50 opacity-60' : 'bg-white shadow-md'}
                `}>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-bold text-gray-500 uppercase">{item.time}</span>
                                    {isPast && <CheckCircle size={20} className="text-gray-400" />}
                                </div>
                                <h3 className="text-xl font-bold text-black mb-1">{item.title}</h3>
                                <p className="text-gray-500 font-medium">{item.location}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default SchedulePage;
