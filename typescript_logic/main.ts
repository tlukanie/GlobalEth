import { cmdIdentify } from "./identify";
import { cmdWallet } from "./wallet";

function parseAndRouteCommand(userInput: string): void {
    /** Parse user input and route to the appropriate command. */
    userInput = userInput.toLowerCase().trim();

    // Check for transaction-related keywords
    if (/\b(transaction|tx|check|txid|trans)\b/.test(userInput)) {
        // Extract arguments (e.g., transaction hash)
        const args = userInput.split(" ");
        cmdIdentify(args.slice(1)); // Pass the transaction hash to cmdIdentify
    }
    // Check for wallet-related keywords
    else if (/\b(wallet|address|account|wall|find)\b/.test(userInput)) {
        // Extract arguments (e.g., wallet address)
        const args = userInput.split(" ");
        cmdWallet(args.slice(1)); // Pass the wallet address to cmdWallet
    }
    // Unknown command
    else {
        console.log("Unknown command. Please specify 'transaction' or 'wallet'.");
    }
}

// Example usage
async function main(): Promise<void> {
    console.log("Type 'exit' to quit the program.");
    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    while (true) {
        // Prompt the user for input
        const userInput: string = await new Promise((resolve) =>
            readline.question("> ", resolve)
        );

        // Exit condition
        if (userInput.toLowerCase() === "exit") {
            console.log("Exiting the program. Goodbye!");
            readline.close();
            break;
        }

        // Process the input
        parseAndRouteCommand(userInput);
    }
}

main().catch((error) => console.error(`Error: ${error}`));