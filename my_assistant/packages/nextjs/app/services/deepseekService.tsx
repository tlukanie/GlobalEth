import axios from "axios";

// Message history for DeepSeek
export const messageHistory: Array<{
    role: "system" | "user" | "assistant";
    content: string;
}> = [
    {
        role: "system",
        content: `You are Larisa Assistant, a helpful AI.
Your responses must be:
- Concise (maximum 5 sentences)
- Plain text without markdown formatting
- Friendly and informative
- Focused on blockchain topics when relevant

When users ask about blockchain data, provide simple explanations without technical details.
Don't use markdown formatting or code blocks.`
    },
];

export async function callDeepSeekAPI(userMessage: string) {
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
