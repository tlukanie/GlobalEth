"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { callDeepSeekAPI, messageHistory } from "./services/deepseekService";
import { processCommandIntent, executeCommand } from "./services/commandService";
import MessageList from "./components/MessageList";
import InputArea from "./components/InputArea";
import { identifyTransaction } from "./identify";
import { analyzeWallet } from "./wallet";

const Home: NextPage = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSend = async () => {
        if (inputValue.trim() === "") return;

        const messageToSend = inputValue.trim();
        setMessages(prev => [...prev, `You: ${messageToSend}`]);
        setInputValue("");
        setIsLoading(true);

        // Check if it's an explicit command first
        const [command, ...args] = messageToSend.split(' ');

        if (command === 'identify') {
            const hash = args[0];
            if (!hash) {
                setMessages(prev => [...prev, "Bot: Please provide a transaction hash. Format: identify <hash>"]);
                setIsLoading(false);
                return;
            }

            try {
                setMessages(prev => [...prev, `Bot: Starting transaction analysis...`]);
                const result = await identifyTransaction(messageToSend);
                setMessages(prev => [...prev, `Bot: ${result}`]);
            } catch (error) {
                setMessages(prev => [...prev, "Bot: Error analyzing transaction."]);
            } finally {
                setIsLoading(false);
                return;
            }
        } else if (command === 'wallet') {
            if (args.length === 0) {
                setMessages(prev => [...prev, "Bot: Please provide a wallet address. Format: wallet <address>"]);
                setIsLoading(false);
                return;
            }

            try {
                setMessages(prev => [...prev, `Bot: Starting wallet analysis... This may take a moment.`]);
                const result = await analyzeWallet(messageToSend);
                setMessages(prev => [...prev, `Bot: ${result}`]);
            } catch (error) {
                setMessages(prev => [...prev, "Bot: Error analyzing wallet."]);
            } finally {
                setIsLoading(false);
                return;
            }
        } else if (command === '/reset') {
            // Reset message history but keep system prompt
            messageHistory.splice(1);
            setMessages(prev => [...prev, "Bot: Conversation history has been reset."]);
            setIsLoading(false);
            return;
        } else {
            // Check for implicit commands via DeepSeek
            const intentAnalysis = await processCommandIntent(messageToSend);

            if (intentAnalysis.useCommand && intentAnalysis.command && intentAnalysis.params) {
                try {
                    const commandAction = intentAnalysis.command === 'identify'
                        ? "I'll check that transaction for you..."
                        : "Analyzing that wallet address... This may take a moment.";

                    setMessages(prev => [...prev, `Bot: ${commandAction}`]);
                    const result = await executeCommand(intentAnalysis.command, intentAnalysis.params);
                    setMessages(prev => [...prev, `Bot: ${result}`]);
                } catch (error) {
                    setMessages(prev => [...prev, `Bot: Error analyzing that ${intentAnalysis.command}.`]);
                } finally {
                    setIsLoading(false);
                    return;
                }
            }

            // Regular conversation flow
            try {
                const aiResponse = await callDeepSeekAPI(messageToSend);
                setMessages(prev => [...prev, `Bot: ${aiResponse}`]);
            } catch (error) {
                setMessages(prev => [...prev, "Bot: Sorry, something went wrong."]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="flex flex-col h-[80vh]">
            <div className="flex-1 flex flex-col items-center p-4">
                <div className="flex flex-col w-full max-w-2xl h-full bg-base-100 rounded-box shadow-xl border border-base-300 overflow-hidden">
                    <div className="bg-primary text-primary-content p-4">
                        <h1 className="text-lg font-semibold text-center">Larisa Assistant</h1>
                    </div>

                    <MessageList messages={messages} isLoading={isLoading} />

                    <InputArea
                        inputValue={inputValue}
                        setInputValue={setInputValue}
                        handleSend={handleSend}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
