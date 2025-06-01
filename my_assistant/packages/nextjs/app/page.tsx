"use client";

import { useState, useRef, useEffect } from "react";
import type { NextPage } from "next";
import axios from "axios";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { identifyTransaction } from "./identify";
import { analyzeWallet } from "./wallet";

// Message history for DeepSeek
const messageHistory: Array<{
	role: "system" | "user" | "assistant";
	content: string;
}> = [
		{
			role: "system",
			content: `You are Larisa Assistant, a helpful AI. Provide concise, accurate responses.
You have special commands to analyze blockchain data:
1. identify [transaction hash] - Analyzes a blockchain transaction
2. wallet [wallet address] - Analyzes a wallet's balance and activity

When users ask about transactions or wallets, determine if they want to execute these commands.
Always respond with a JSON object with properties "useCommand" (boolean), "command" (string), and "params" (string).
Example: {"useCommand": true, "command": "identify", "params": "0x123..."}
`,
		},
	];

const Home: NextPage = () => {
	const [messages, setMessages] = useState<string[]>([]);
	const [inputValue, setInputValue] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Auto-scroll to bottom of messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// Auto-focus the input
	useEffect(() => {
		inputRef.current?.focus();
	}, [isLoading]);

	async function callDeepSeekAPI(userMessage: string) {
		try {
			const response = await axios.post(
				"https://api.deepseek.com/v1/chat/completions",
				{
					model: "deepseek-chat",
					messages: [
						...messageHistory,
						{ role: "user", content: userMessage }
					],
					stream: false
				},
				{
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer sk-046d30999a354d04a61bc48c0e2ec63e`
					}
				}
			);

			const content = response.data.choices[0].message.content;

			// Add to message history for context maintenance
			messageHistory.push({ role: "user", content: userMessage });
			messageHistory.push({
				role: "assistant",
				content: content
			});

			return content;
		} catch (error) {
			console.error("DeepSeek API Error:", error);
			return "Sorry, I encountered an error processing your request.";
		}
	}

	async function processCommandIntent(userMessage: string) {
		try {
			// First analyze the user's intent
			const response = await axios.post(
				"https://api.deepseek.com/v1/chat/completions",
				{
					model: "deepseek-chat",
					messages: [
						{
							role: "system",
							content: `You are an assistant that analyzes user messages to determine if they want to run a blockchain command.
Available commands are:
1. identify [transaction hash] - Analyzes a blockchain transaction
2. wallet [wallet address] - Analyzes a wallet's balance and activity

If the user is asking about a transaction or wallet, extract the hash/address.
Respond with a JSON object with properties:
- useCommand: true if a command should be executed, false otherwise
- command: "identify" or "wallet" if applicable
- params: the transaction hash or wallet address if applicable
- reason: brief explanation of your decision

Example: {"useCommand": true, "command": "identify", "params": "0x123abc...", "reason": "User asked about transaction details"}
Do not include any other text in your response, only the JSON.`
						},
						{
							role: "user",
							content: userMessage
						}
					],
					stream: false
				},
				{
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer sk-046d30999a354d04a61bc48c0e2ec63e`
					}
				}
			);

			let content = response.data.choices[0].message.content;

			// Improve JSON parsing to handle imperfect responses from DeepSeek
			try {
				// First attempt to clean the response content
				let cleanedContent = content.trim();

				// Check if content is wrapped in markdown code blocks and extract
				const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
				const markdownMatch = cleanedContent.match(jsonBlockRegex);
				if (markdownMatch && markdownMatch[1]) {
					cleanedContent = markdownMatch[1].trim();
				}

				// Handle cases where there might be text before or after the JSON
				const jsonRegex = /\{[\s\S]*\}/;
				const jsonMatch = cleanedContent.match(jsonRegex);
				if (jsonMatch) {
					cleanedContent = jsonMatch[0];
				}

				// Now try to parse the cleaned JSON
				const intentData = JSON.parse(cleanedContent);

				if (intentData.useCommand) {
					if (intentData.command === "identify" && intentData.params) {
						return {
							useCommand: true,
							command: "identify",
							params: intentData.params
						};
					} else if (intentData.command === "wallet" && intentData.params) {
						return {
							useCommand: true,
							command: "wallet",
							params: intentData.params
						};
					}
				}
			} catch (e) {
				console.error("Error parsing intent JSON:", e);
				console.log("Raw content:", content);
				// Continue with regular message flow if JSON parsing fails
			}

			return { useCommand: false };
		} catch (error) {
			console.error("DeepSeek Intent Analysis Error:", error);
			return { useCommand: false };
		}
	}

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

			if (intentAnalysis.useCommand) {
				if (intentAnalysis.command === 'identify') {
					try {
						setMessages(prev => [...prev, `Bot: I'll check that transaction for you...`]);
						const result = await identifyTransaction(`identify ${intentAnalysis.params}`);
						setMessages(prev => [...prev, `Bot: ${result}`]);
						setIsLoading(false);
						return;
					} catch (error) {
						setMessages(prev => [...prev, "Bot: Error analyzing that transaction."]);
						setIsLoading(false);
						return;
					}
				} else if (intentAnalysis.command === 'wallet') {
					try {
						setMessages(prev => [...prev, `Bot: Analyzing that wallet address... This may take a moment.`]);
						const result = await analyzeWallet(`wallet ${intentAnalysis.params}`);
						setMessages(prev => [...prev, `Bot: ${result}`]);
						setIsLoading(false);
						return;
					} catch (error) {
						setMessages(prev => [...prev, "Bot: Error analyzing that wallet."]);
						setIsLoading(false);
						return;
					}
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
											className={`max-w-xs lg:max-w-md px-4 py-2 rounded-box ${message.startsWith('You:')
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
