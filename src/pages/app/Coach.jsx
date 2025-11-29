import React, { useState, useEffect, useRef } from 'react';
import { FiMic, FiSend } from 'react-icons/fi';
import chatbotAvatar from '../../assets/chatbot.png';
import userAvatar from '../../assets/boy.png';

const initialMessages = [
  {
    id: 1,
    sender: 'FinBuddy',
    avatar: chatbotAvatar,
    content: 'How can I help you plan your finances today? Try asking ‘What if I lose my job?’',
  },
];

function ChatPanel() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = {
        id: Date.now(),
        sender: 'You',
        avatar: userAvatar,
        content: input.trim(),
      };
      setMessages(prev => [...prev, userMessage]);
      const currentInput = input.trim();
      setInput('');
      setIsLoading(true);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}api/v1/agent/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ query: currentInput }),
        });

        if (!response.ok) {
          throw new Error('Failed to get a response from FinBuddy.');
        }

        const data = await response.json();

        const botResponse = {
          id: Date.now() + 1,
          sender: 'FinBuddy',
          avatar: chatbotAvatar,
          content: data.response || "I'm not sure how to respond to that.",
        };
        setMessages(prev => [...prev, botResponse]);

      } catch (error) {
        const errorResponse = {
          id: Date.now() + 1,
          sender: 'FinBuddy',
          avatar: chatbotAvatar,
          content: `Sorry, something went wrong. ${error.message}`,
        };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col bg-[#161a25] h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'You' ? 'justify-end' : ''}`}>
            {msg.sender !== 'You' && <img src={msg.avatar} alt="avatar" className="w-8 h-8 rounded-full" />}
            <div className={`max-w-2xl ${msg.sender === 'You' ? 'order-first' : ''}`}>
              {msg.sender !== 'You' && (
                <p className="text-sm font-semibold mb-1">{msg.sender}</p>
              )}
              <div className={`p-3 rounded-lg ${msg.sender === 'You' ? 'bg-blue-600' : 'bg-gray-800'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
            {msg.sender === 'You' && <img src={msg.avatar} alt="avatar" className="w-8 h-8 rounded-full" />}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3">
                <img src={chatbotAvatar} alt="avatar" className="w-8 h-8 rounded-full" />
                <div className="p-3 rounded-lg bg-gray-800">
                    <div className="flex items-center justify-center gap-1.5">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 mx-auto w-full">
        <div className="bg-gray-800 rounded-lg flex items-center px-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isLoading ? "FinBuddy is thinking..." : "Ask FinBuddy anything..."}
            className="flex-1 bg-transparent py-3 text-white placeholder-gray-500 focus:outline-none disabled:opacity-50"
            disabled={isLoading}
          />
          <button className="text-gray-400 hover:text-white p-2 disabled:opacity-50" disabled={isLoading}>
            <FiMic size={20} />
          </button>
          <button onClick={handleSend} className="bg-blue-600 rounded-md p-2 ml-2 my-1.5 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!input.trim() || isLoading}>
            <FiSend size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Coach() {
  return (
    <div className="h-full w-full">
      <ChatPanel />
    </div>
  );
}