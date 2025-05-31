"use client";

import { useState } from "react";
import type { NextPage } from "next";
import axios from "axios"; // Import axios for API calls"use client";
// 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

const Home: NextPage = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");

  const handleSend = async () => {
    if (inputValue.trim() === "") return;

    // Add the user's message to the chat
    setMessages([...messages, `You: ${inputValue}`]);

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
    }

    setInputValue(""); // Clear the input field
  };

  return (
    <div className="flex flex-col h-screen bg-base-300">
      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className="mb-2 p-2 bg-gray-200 rounded-lg max-w-xs self-start"
          >
            {message}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Type your message..."
          className="flex-grow p-2 border rounded-lg mr-2"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Home;

