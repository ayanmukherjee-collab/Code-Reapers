import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const ScheduleManager = () => {
    // Mock Events
    const [events] = useState([
        { id: 1, title: 'Faculty Meeting', time: '10:00 AM - 11:30 AM', location: 'Conference Room A', type: 'Meeting', date: 25 },
        { id: 2, title: 'Campus Clean Drive', time: '09:00 AM - 12:00 PM', location: 'Main Grounds', type: 'Event', date: 26 },
        { id: 3, title: 'Guest Lecture: AI', time: '02:00 PM - 04:00 PM', location: 'Auditorium', type: 'Lecture', date: 26 },
    ]);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = 25; // Mock current day

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-black">Schedule Manager</h1>
                    <p className="text-gray-500 mt-1">Organize events, classes, and shifts.</p>
                </div>
                <button
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl"
                >
                    <Plus size={20} />
                    Add Event
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Widget */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-black">December 2025</h2>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={24} /></button>
                            <button className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={24} /></button>
                        </div>
                    </div>

                    {/* Week Header */}
                    <div className="grid grid-cols-7 mb-4">
                        {days.map(d => (
                            <div key={d} className="text-center text-sm font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-y-4">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                            const isToday = day === currentDay;
                            const hasEvent = events.some(e => e.date === day);

                            return (
                                <div key={day} className="flex flex-col items-center gap-1 min-h-[60px]">
                                    <button className={`
                                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                                        ${isToday ? 'bg-black text-white shadow-lg scale-110' : 'text-gray-700 hover:bg-gray-100'}
                                    `}>
                                        {day}
                                    </button>
                                    {hasEvent && (
                                        <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Upcoming Events List */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest text-sm">Upcoming</h2>
                    {events.map(event => (
                        <div key={event.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${event.type === 'Meeting' ? 'bg-black' : event.type === 'Lecture' ? 'bg-gray-400' : 'bg-gray-200'}`}></div>
                            <div className="pl-3">
                                <span className="text-xs font-bold text-gray-400 uppercase">{event.type}</span>
                                <h3 className="text-lg font-bold text-black mt-1 mb-2">{event.title}</h3>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                        <Clock size={16} />
                                        {event.time}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                        <MapPin size={16} />
                                        {event.location}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScheduleManager;
