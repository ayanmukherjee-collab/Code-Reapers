import React, { useState } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { Button, Input } from './';

const ChatbotBubble = () => { // Correctly defined component name
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! I'm your campus AI assistant. How can I help you today?", sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState('');

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, newMsg]);
        setInputText('');

        // Dummy AI Response
        setTimeout(() => {
            const aiMsg = { id: Date.now() + 1, text: "That's a great question! I'm still learning, but I can help you find classrooms or faculty.", sender: 'ai' };
            setMessages(prev => [...prev, aiMsg]);
        }, 1000);
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
                <div className="fixed bottom-44 right-6 w-80 h-96 bg-white rounded-[32px] shadow-2xl border border-gray-100 flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 overflow-hidden">

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
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                       max-w-[80%] p-3 text-sm rounded-2xl
                       ${msg.sender === 'user'
                                        ? 'bg-black text-white rounded-br-none'
                                        : 'bg-gray-100 text-black rounded-bl-none'}
                    `}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
                        <input
                            className="flex-1 bg-white rounded-full px-4 text-sm outline-none border border-gray-200 focus:border-black transition-colors"
                            placeholder="Ask me anything..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            onClick={handleSend}
                            className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shrink-0 hover:bg-gray-800"
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
