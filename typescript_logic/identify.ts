import * as axios from "axios";

interface Network {
    name: string;
    rpc_url: string;
    explorer_url: string;
}

const NETWORKS: Network[] = [
    {
        name: "Sepolia Testnet",
        rpc_url: "https://eth-sepolia.blockscout.com/api/eth-rpc",
        explorer_url: "https://eth-sepolia.blockscout.com/tx"
    },
    {
        name: "Rootstock Testnet",
        rpc_url: "https://rootstock-testnet.blockscout.com/api/eth-rpc",
        explorer_url: "https://rootstock-testnet.blockscout.com/tx"
    }
];

const HEADERS = { "Content-Type": "application/json" };

async function ethRpc(url: string, method: string, params: any[]): Promise<any> {
    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: method,
        params: params
    };

    try {
        const response = await axios.post(url, payload, { headers: HEADERS, timeout: 5000 });
        return response.data.result;
    } catch (error) {
        console.error(`Error in ethRpc: ${error}`);
        return null;
    }
}

async function checkTransactionInNetwork(network: Network, txHash: string): Promise<any | null> {
    const tx = await ethRpc(network.rpc_url, "eth_getTransactionByHash", [txHash]);
    if (!tx) return null;

    const receipt = await ethRpc(network.rpc_url, "eth_getTransactionReceipt", [txHash]) || {};
    return { network, tx, receipt };
}

async function identifyIntent(userInput: string): Promise<string | null> {
    const apiUrl = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
    const headers = { Authorization: `Bearer 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` };
    const payload = {
        inputs: userInput,
        parameters: { candidate_labels: ["wallet", "transaction"] }
    };

    try {
        const response = await axios.post(apiUrl, payload, { headers });
        return response.data.labels[0]; // Return the top label
    } catch (error) {
        console.error(`Error identifying intent: ${error}`);
        return null;
    }
}

export async function cmdIdentify(args: string[]): Promise<void> {
    if (!args.length) {
        console.log("Usage: identify [query]");
        return;
    }

    const userInput = args.join(" ");
    const intent = await identifyIntent(userInput);

    if (intent === "transaction") {
        const txHash = userInput.split(" ").pop() || ""; // Assume the transaction hash is the last word
        console.log(`Looking up transaction: ${txHash}`);

        let result: any = null;
        for (const network of NETWORKS) {
            console.log(`Checking ${network.name}...`);
            result = await checkTransactionInNetwork(network, txHash);
            if (result) {
                console.log(`Transaction found on ${network.name}!`);
                break;
            }
        }

        if (!result) {
            console.log("Transaction not found in any supported network.");
            return;
        }

        const { tx, receipt, network } = result;
        const status = receipt.status || "0x0";
        const blockNum = parseInt(tx.blockNumber || "0x0", 16);
        const from = tx.from;
        const to = tx.to;
        const valueWei = parseInt(tx.value || "0x0", 16);
        const gasUsed = parseInt(receipt.gasUsed || "0x0", 16);
        const gasLimit = parseInt(tx.gas || "0x0", 16);
        const gasPrice = parseInt(tx.gasPrice || "0x0", 16);
        const feeWei = gasUsed * gasPrice;

        console.log(`\nTransaction Details (${network.name})`);
        console.log(`Transaction:   ${txHash}`);
        console.log(`Status:        ${status === "0x1" ? "Success" : "Failed"}`);
        console.log(`Block:         ${blockNum}`);
        console.log(`From:          ${from}`);
        console.log(`To:            ${to}`);
        console.log(`Value:         ${(valueWei / 10 ** 18).toFixed(6)} ETH`);
        console.log(`Gas used:      ${gasUsed} / ${gasLimit}`);
        console.log(`Gas price:     ${(gasPrice / 10 ** 9).toFixed(2)} Gwei`);
        console.log(`Fee:           ${(feeWei / 10 ** 18).toFixed(6)} ETH`);
        console.log(`Explorer URL:  ${network.explorer_url}/${txHash}`);
    } else if (intent === "wallet") {
        console.log("Wallet lookup is not implemented yet.");
        // Add wallet lookup logic here
    } else {
        console.log("Could not determine intent. Please specify if it's a wallet or transaction query.");
    }
}
