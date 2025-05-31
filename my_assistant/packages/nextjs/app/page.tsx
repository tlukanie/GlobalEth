"use client";

import { useState, useRef, useEffect } from "react";
import type { NextPage } from "next";
import axios from "axios"; // Import axios for API calls"use client";
// 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
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

const Home: NextPage = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

  const handleSend = async () => {
    if (inputValue.trim() === "") return;

    // Add the user's message to the chat
    setMessages([...messages, `You: ${inputValue}`]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Hugging Face API endpoint
      const apiUrl = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";

      // Send the user's message to the Hugging Face API
      const response = await axios.post(
        apiUrl,
        { inputs: inputValue }, // Payload for the API
        {
          headers: {
            Authorization: `Bearer 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`, // Replace with your Hugging Face API token
          },
        }
      );

      // Add the API's response to the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        `Bot: ${response.data.generated_text}`, // Replace `generated_text` with the actual response field
      ]);
    } catch (error) {
      console.error("Error sending message to Hugging Face API:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        "Bot: Sorry, something went wrong.",
      ]);
    } finally {
      setIsLoading(false); // This ensures loading state is always reset
    }

    setInputValue(""); // Clear the input field
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="flex flex-col w-full max-w-2xl h-[90%] bg-base-100 rounded-box shadow-xl border border-base-300 overflow-hidden">
        {/* Header */}
          <div className="bg-primary text-primary-content p-4">
            <h1 className="text-lg font-semibold text-center">Larisa Assistant</h1>
          </div>
  
          {/* Chat Area */}
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
                    className={`flex ${message.startsWith('You:') ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-box ${
                        message.startsWith('You:') 
                          ? 'bg-primary text-primary-content' 
                          : 'bg-base-100 text-base-content shadow-sm border border-base-300'
                      }`}
                    >
                      <p className="text-sm">{message}</p>
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
  
          {/* Input Area */}
          <div className="border-t border-base-300 p-4 bg-base-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="input input-bordered flex-1 focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="btn btn-primary rounded-full p-2"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;