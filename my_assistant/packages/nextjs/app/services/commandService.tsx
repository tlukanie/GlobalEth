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

DO NOT include any explanations - ONLY return the JSON object.`
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

export async function executeCommand(command: string, params: string): Promise<string> {
  try {
    if (command === 'identify') {
      return await identifyTransaction(`identify ${params}`);
    } else if (command === 'wallet') {
      return await analyzeWallet(`wallet ${params}`);
    }
    return "Unknown command";
  } catch (error) {
    console.error(`Error executing command ${command}:`, error);
    return `Error executing ${command} command`;
  }
}
