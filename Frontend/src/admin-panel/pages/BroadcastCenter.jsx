import React, { useState } from 'react';
import { Radio, Send, AlertTriangle, Info, CheckCircle, Bell } from 'lucide-react';
import { Input } from '../../components';

const BroadcastCenter = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info'); // info, warning, urgent
    const [history, setHistory] = useState([
        { id: 1, title: 'Campus Closed', message: 'Due to heavy snow, campus is closed today.', severity: 'urgent', date: '2 hrs ago' },
        { id: 2, title: 'Maintenance Update', message: 'Library server maintenance scheduled for tonight.', severity: 'info', date: 'Yesterday' },
    ]);

    const handleSend = (e) => {
        e.preventDefault();
        const newAlert = {
            id: Date.now(),
            title,
            message,
            severity,
            date: 'Just now'
        };
        setHistory([newAlert, ...history]);
        setTitle('');
        setMessage('');
        alert("Broadcast Sent Successfully!");
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-black">Broadcast Center</h1>
                    <p className="text-gray-500 mt-1">Send real-time alerts and notifications to all users.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Send Form */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm h-fit">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Send size={24} />
                        New Broadcast
                    </h2>
                    <form onSubmit={handleSend} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Alert Title</label>
                            <Input
                                placeholder="e.g. Emergency Evacuation"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Severity Level</label>
                            <div className="flex gap-3">
                                {[
                                    { id: 'info', label: 'Info', icon: Info },
                                    { id: 'warning', label: 'Warning', icon: AlertTriangle },
                                    { id: 'urgent', label: 'Urgent', icon: Bell },
                                ].map((level) => (
                                    <button
                                        key={level.id}
                                        type="button"
                                        onClick={() => setSeverity(level.id)}
                                        className={`
                                            flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                                            ${severity === level.id ? `border-black bg-black text-white` : `border-gray-100 hover:border-gray-300 text-gray-400`}
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${severity === level.id ? 'bg-white text-black' : 'bg-gray-100'}`}>
                                            <level.icon size={16} />
                                        </div>
                                        <span className="font-bold text-sm">{level.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                            <textarea
                                className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-black/5 min-h-[120px] resize-none"
                                placeholder="Type your message here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <Radio size={20} />
                            Broadcast Now
                        </button>
                    </form>
                </div>

                {/* History */}
                <div>
                    <h2 className="text-xl font-bold mb-6 text-gray-400 uppercase tracking-widest text-sm">Recent Broadcasts</h2>
                    <div className="space-y-4">
                        {history.map((alert) => (
                            <div key={alert.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex gap-4">
                                <div className={`
                                     w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md transition-colors
                                     ${alert.severity === 'urgent' ? 'bg-black text-white' : alert.severity === 'warning' ? 'bg-gray-200 text-black' : 'bg-white border border-gray-200 text-black'}
                                 `}>
                                    {alert.severity === 'urgent' ? <Bell size={24} /> : alert.severity === 'warning' ? <AlertTriangle size={24} /> : <Info size={24} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-bold text-black">{alert.title}</h3>
                                        <span className="text-xs font-bold text-gray-400">{alert.date}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm leading-relaxed">{alert.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BroadcastCenter;
