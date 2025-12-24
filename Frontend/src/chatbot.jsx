import React, { useRef, useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from './themeContext.jsx';

export default function Chatbot() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: 'Hi! Ask me anything about faculty, rooms, or navigation.' },
    { id: 2, from: 'user', text: 'Where is the CSE library?' },
    { id: 3, from: 'bot', text: 'The CSE Library is in the Tech Block, 2nd Floor, Room 205.' },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    // scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now(), from: 'user', text: input };
    setMessages((m) => [...m, newMsg]);
    setInput('');

    // mock bot response
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, from: 'bot', text: 'Start Navigation ➜' }]);
    }, 700);
  };

  return (
    <div className={`h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
      <div className={`w-full h-full ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} shadow-xl overflow-hidden flex flex-col`}>        
        {/* header */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-200 fixed top-0 left-0 right-0 z-50 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
          <button onClick={() => navigate(-1)} className="text-gray-500">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">●</div>
            <div>
              <div className="text-sm font-semibold">Campus Assistant</div>
              {/* <div className="text-xs text-gray-400">online</div> */}
            </div>
          </div>
          {/* theme toggles at the far right (same level as profile) */}
          {/* <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Light mode"
              onClick={() => setTheme('light')}
              className={`p-2 rounded-full ${theme === 'light' ? 'bg-gray-200' : 'bg-transparent'}`}
            >
              <span className={`material-symbols-outlined ${theme === 'dark' ? 'text-white' : 'text-black'}`}>light_mode</span>
            </button>
            <button
              aria-label="Dark mode"
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-transparent'}`}
            >
              <span className={`material-symbols-outlined ${theme === 'dark' ? 'text-white' : 'text-black'}`}>dark_mode</span>
            </button>
          </div> */}
        </div>

        {/* messages (only this area scrolls) */}
        <div ref={scrollRef} className={`flex-1 p-4 overflow-y-auto ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'} pt-20 pb-28`}> 
          <div className="space-y-4">
            {messages.map((m) =>
                m.from === 'bot' ? (
                  <div key={m.id} className="flex items-start">
                    <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded-xl p-3 shadow-sm max-w-[80%] text-sm`}>
                      <div>{m.text}</div>
                      {/CSE Library/i.test(m.text) && (
                        <div className="mt-2 font-medium text-sm text-blue-500 flex items-center gap-2">
                          <span>Start navigation ➜ </span>
                          {/* <span className="material-symbols-outlined">arrow_forward</span> */}
                        </div>
                      )}
                    </div>
                  </div>
              ) : (
                <div key={m.id} className="flex items-end justify-end">
                  <div className={`${theme === 'dark' ? 'bg-white text-black' : 'bg-gray-900 text-white'} rounded-xl p-3 shadow-sm text-sm max-w-[80%]`}>{m.text}</div>
                </div>
              )
            )}
          </div>
        </div>

        {/* footer: quick chips + input (fixed at bottom of chat container) */}
        <div className={`flex-none border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
          <div className="px-4 py-2">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button className={`text-xs px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>Who is Dean of Science?</button>
              <button className={`text-xs px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>Cafeteria menu</button>
              <button className={`text-xs px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>Open hours</button>
            </div>
          </div>

          <div className="px-3 py-3">
            <div className="flex gap-2 items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Type your question..."
                className={`flex-1 rounded-full px-4 py-2 outline-none text-sm ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}
              />
              <button onClick={send} className={`${theme === 'dark' ? 'w-10 h-10 bg-white text-black' : 'w-10 h-10 bg-gray-900 text-white'} rounded-full flex items-center justify-center`}>
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}