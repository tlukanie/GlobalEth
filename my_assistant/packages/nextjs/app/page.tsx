"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { callDeepSeekAPI, messageHistory } from "./services/deepseekService";
import { processCommandIntent, executeCommand } from "./services/commandService";
import MessageList from "./components/MessageList";
import InputArea from "./components/InputArea";
import { identifyTransaction } from "./identify";
import { analyzeWallet } from "./wallet";

// Define the message interface
interface Message {
	text: string;
	sender: 'user' | 'bot';
}

const Home: NextPage = () => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputValue, setInputValue] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const handleSend = async () => {
		if (inputValue.trim() === "") return;

		const messageToSend = inputValue.trim();
		setMessages(prev => [...prev, { text: messageToSend, sender: 'user' }]);
		setInputValue("");
		setIsLoading(true);

		// Check if it's an explicit command first
		const [command, ...args] = messageToSend.split(' ');

		if (command === 'identify') {
			const hash = args[0];
			if (!hash) {
				setMessages(prev => [...prev, { text: "Please provide a transaction hash. Format: identify <hash>", sender: 'bot' }]);
				setIsLoading(false);
				return;
			}

			try {
				setMessages(prev => [...prev, { text: "Starting transaction analysis...", sender: 'bot' }]);
				const result = await identifyTransaction(messageToSend);
				setMessages(prev => [...prev, { text: result, sender: 'bot' }]);
			} catch (error) {
				setMessages(prev => [...prev, { text: "Error analyzing transaction.", sender: 'bot' }]);
			} finally {
				setIsLoading(false);
				return;
			}
		} else if (command === 'wallet') {
			if (args.length === 0) {
				setMessages(prev => [...prev, { text: "Please provide a wallet address. Format: wallet <address>", sender: 'bot' }]);
				setIsLoading(false);
				return;
			}

			try {
				setMessages(prev => [...prev, { text: "Starting wallet analysis... This may take a moment.", sender: 'bot' }]);
				const result = await analyzeWallet(messageToSend);
				setMessages(prev => [...prev, { text: result, sender: 'bot' }]);
			} catch (error) {
				setMessages(prev => [...prev, { text: "Error analyzing wallet.", sender: 'bot' }]);
			} finally {
				setIsLoading(false);
				return;
			}
		} else if (command === '/reset') {
			// Reset message history but keep system prompt
			messageHistory.splice(1);
			setMessages(prev => [...prev, { text: "Conversation history has been reset.", sender: 'bot' }]);
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

					setMessages(prev => [...prev, { text: commandAction, sender: 'bot' }]);

					// Get both results
					const { rawResult, explanation } = await executeCommand(intentAnalysis.command, intentAnalysis.params);

					// Display as separate messages
					setMessages(prev => [...prev, { text: rawResult, sender: 'bot' }]);

					// Only show explanation if we have one
					if (explanation) {
						setMessages(prev => [...prev, { text: "My Analysis: " + explanation, sender: 'bot' }]);
					}
				} catch (error) {
					setMessages(prev => [...prev, { text: `Error analyzing that ${intentAnalysis.command}.`, sender: 'bot' }]);
				} finally {
					setIsLoading(false);
					return;
				}
			}

			// Regular conversation flow
			try {
				const aiResponse = await callDeepSeekAPI(messageToSend);
				setMessages(prev => [...prev, { text: aiResponse, sender: 'bot' }]);
			} catch (error) {
				setMessages(prev => [...prev, { text: "Sorry, something went wrong.", sender: 'bot' }]);
			} finally {
				setIsLoading(false);
			}
		}
	};

	return (
		<div className="flex flex-col h-full">
        <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="flex flex-col w-full max-w-2xl h-[90%] bg-base-100 rounded-box shadow-xl border border-base-300 overflow-hidden">
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
