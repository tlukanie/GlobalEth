import axios from "axios";
import { identifyTransaction } from "../identify";
import { analyzeWallet } from "../wallet";

export interface CommandResult {
	useCommand: boolean;
	command?: string;
	params?: string;
}

export async function processCommandIntent(userMessage: string): Promise<CommandResult> {
	try {
		const response = await axios.post(
			"https://api.deepseek.com/v1/chat/completions",
			{
				model: "deepseek-chat",
				messages: [
					{
						role: "system",
						content: `You analyze messages to identify blockchain data requests.
Available commands are:
1. identify [transaction hash] - Analyzes a transaction
2. wallet [wallet address] - Analyzes a wallet

If the message asks about blockchain data, respond with ONLY a JSON object:
{"command": "[identify or wallet]", "params": "[transaction hash or wallet address]"}

For any other message that doesn't need blockchain analysis, respond with:
{"command": "chat"}

DO NOT include any explanations - ONLY return the JSON object.
Don't use markdown formatting or code blocks.`
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

		// Enhanced JSON parsing
		try {
			let cleanedContent = content.trim();
			// Extract JSON from code blocks if present
			const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
			const markdownMatch = cleanedContent.match(jsonBlockRegex);
			if (markdownMatch && markdownMatch[1]) {
				cleanedContent = markdownMatch[1].trim();
			}
			// Find JSON object anywhere in the string
			const jsonRegex = /\{[\s\S]*\}/;
			const jsonMatch = cleanedContent.match(jsonRegex);
			if (jsonMatch) {
				cleanedContent = jsonMatch[0];
			}

			const intentData = JSON.parse(cleanedContent);

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

			// Not a blockchain command request
			return { useCommand: false };
		} catch (e) {
			console.error("Error parsing intent JSON:", e);
			console.log("Raw content:", content);
			return { useCommand: false };
		}
	} catch (error) {
		console.error("DeepSeek Intent Analysis Error:", error);
		return { useCommand: false };
	}
}

// Update the executeCommand function to return an object with separate results
export async function executeCommand(command: string, params: string): Promise<{rawResult: string; explanation: string}> {
    try {
        // Execute the blockchain command
        let rawResult = "";
        if (command === 'identify') {
            rawResult = await identifyTransaction(`identify ${params}`);
        } else if (command === 'wallet') {
            rawResult = await analyzeWallet(`wallet ${params}`);
        } else {
            return {
                rawResult: "Unknown command",
                explanation: ""
            };
        }

        // Get DeepSeek explanation as a separate result
        const explanation = await explainCommandResult(command, params, rawResult);

        // Return both pieces separately
        return {
            rawResult,
            explanation
        };
    } catch (error) {
        console.error(`Error executing command ${command}:`, error);
        return {
            rawResult: `Error executing ${command} command`,
            explanation: ""
        };
    }
}

// New function to have DeepSeek explain the command results
async function explainCommandResult(command: string, params: string, rawResult: string): Promise<string> {
	try {
		const prompt = command === 'identify'
			? `This is information about transaction ${params}:`
			: `This is information about wallet ${params}:`;

		const response = await axios.post(
			"https://api.deepseek.com/v1/chat/completions",
			{
				model: "deepseek-chat",
				messages: [
					{
						role: "system",
						content: `You are a blockchain analyst assistant.
Your job is to interpret blockchain data results in a friendly, easy-to-understand way.
Limit your response to 3-4 sentences focusing on:
1. What happened in the transaction OR what the wallet contains/has done
2. Any notable findings or patterns
3. Keep it simple for non-technical users

Don't repeat all the data - explain what it means in plain language.
Don't use markdown formatting or code blocks.`
					},
					{
						role: "user",
						content: `${prompt}\n\n${rawResult}\n\nGive me a simple explanation of what this data shows.`
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

		return response.data.choices[0].message.content;
	} catch (error) {
		console.error("Error explaining command result:", error);
		return "I couldn't analyze this information further at the moment.";
	}
}
