import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, MapPin, Loader2 } from 'lucide-react';

const ChatbotBubble = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! I'm your Campus AI assistant. Ask me about faculty, rooms, or navigation!", sender: 'ai', actions: [] }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const AI_API_URL = "http://localhost:5000";

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMsg = { id: Date.now(), text: inputText, sender: 'user', actions: [] };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await fetch(`${AI_API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: inputText })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            const aiMsg = {
                id: Date.now() + 1,
                text: data.response,
                sender: 'ai',
                actions: data.actions || []
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg = {
                id: Date.now() + 1,
                text: "Sorry, I couldn't connect to the server. Please try again.",
                sender: 'ai',
                actions: []
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigate = (action) => {
        setIsOpen(false);
        navigate(`/map?destination=${action.roomId}&name=${encodeURIComponent(action.roomName)}`);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    fixed bottom-28 right-6 z-50
                    w-14 h-14 rounded-full shadow-2xl
                    flex items-center justify-center
                    transition-all duration-300
                    ${isOpen ? 'bg-white text-black scale-90' : 'bg-black text-white hover:scale-110'}
                `}
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-44 right-6 w-80 h-[28rem] bg-white rounded-[32px] shadow-2xl border border-gray-100 flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 overflow-hidden">

                    {/* Header */}
                    <div className="bg-black text-white p-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Sparkles size={16} />
                        </div>
                        <span className="font-bold">Campus AI</span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`
                                    max-w-[85%] p-3 text-sm rounded-2xl whitespace-pre-line
                                    ${msg.sender === 'user'
                                        ? 'bg-black text-white rounded-br-none'
                                        : 'bg-gray-100 text-black rounded-bl-none'}
                                `}>
                                    {msg.text}
                                </div>
                                {/* Action Buttons */}
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {msg.actions.map((action, i) => (
                                            action.type === 'navigate' && (
                                                <button
                                                    key={i}
                                                    onClick={() => handleNavigate(action)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full hover:bg-green-600 transition-colors"
                                                >
                                                    <MapPin size={12} />
                                                    {action.label}
                                                </button>
                                            )
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex items-start">
                                <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-none">
                                    <Loader2 size={16} className="animate-spin text-gray-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
                        <input
                            className="flex-1 bg-white rounded-full px-4 py-2 text-sm outline-none border border-gray-200 focus:border-black transition-colors"
                            placeholder="Ask about faculty or rooms..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading}
                            className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shrink-0 hover:bg-gray-800 disabled:opacity-50"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatbotBubble;

