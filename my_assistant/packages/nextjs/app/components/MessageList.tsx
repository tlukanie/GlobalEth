import React, { useRef, useEffect } from 'react';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-base-content/50">
          <p>Start a conversation with the AI assistant</p>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-box ${message.sender === 'user'
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-100 text-base-content shadow-sm border border-base-300'
                  }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
      {isLoading && (
        <div className="flex justify-center p-2">
          <span className="loading loading-dots loading-sm text-primary"></span>
        </div>
      )}
    </div>
  );
};

export default MessageList;
