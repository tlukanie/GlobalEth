"use client";

import { useState, useRef, useEffect } from "react";
import type { NextPage } from "next";
import axios from "axios";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { identifyTransaction } from "./identify";
import { analyzeWallet } from "./wallet";

const Home: NextPage = () => {
	const [messages, setMessages] = useState<string[]>([]);
	const [inputValue, setInputValue] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleSend = async () => {
		if (inputValue.trim() === "") return;

		const messageToSend = inputValue.trim();
		setMessages(prev => [...prev, `You: ${messageToSend}`]);
		setInputValue("");
		setIsLoading(true);

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
				setMessages(prev => [...prev, `Bot: Starting wallet analysis...`]);
				const result = await analyzeWallet(messageToSend);
				setMessages(prev => [...prev, `Bot: ${result}`]);
			} catch (error) {
				setMessages(prev => [...prev, "Bot: Error analyzing wallet."]);
			} finally {
				setIsLoading(false);
				return;
			}
		}

		// Regular chat behavior continues here
		try {
			const apiUrl = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";
			const response = await axios.post(
				apiUrl,
				{ inputs: messageToSend },
				{
					headers: {
						Authorization: `Bearer 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`,
					},
				}
			);

			setMessages(prev => [...prev, `Bot: ${response.data.generated_text}`]);
		} catch (error) {
			setMessages(prev => [...prev, "Bot: Sorry, something went wrong."]);
		} finally {
			setIsLoading(false);
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
