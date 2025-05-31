import * as axios from "axios";

const RPC_URL = "https://eth-sepolia.blockscout.com/api/eth-rpc";
const API_URL = "https://eth-sepolia.blockscout.com/api/v2";
const HEADERS = { "Content-Type": "application/json" };

async function ethRpc(method: string, params: any[]): Promise<any> {
    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: method,
        params: params
    };

    try {
        const response = await axios.post(RPC_URL, payload, { headers: HEADERS });
        return response.data.result;
    } catch (error) {
        console.error(`Error in ethRpc: ${error}`);
        throw error;
    }
}

function formatNumber(num: number | string): string {
    if (typeof num === "number") {
        return num.toLocaleString();
    }
    return num;
}

export async function cmdWallet(args: string[]): Promise<void> {
    if (args.length === 0) {
        console.log("Usage: wallet [address]");
        return;
    }

    const address = args[0];
    console.log(`\nWallet Information for: ${address}\n`);

    try {
        // Get balance in Wei and convert to ETH
        const balanceWei = parseInt(await ethRpc("eth_getBalance", [address, "latest"]), 16);
        const balanceEth = balanceWei / 10 ** 18;

        // Get transaction count
        const txCount = parseInt(await ethRpc("eth_getTransactionCount", [address, "latest"]), 16);

        // Check if the address is a contract
        const code = await ethRpc("eth_getCode", [address, "latest"]);
        const isContract = code !== "0x";

        // Fetch address data from the API
        const addressResponse = await axios.get(`${API_URL}/addresses/${address}`);
        const addressData = addressResponse.data;

        // Fetch token data
        const tokenResponse = await axios.get(`${API_URL}/addresses/${address}/tokens`);
        const tokenData = tokenResponse.data;

        // Extract information from the API responses
        const lastBalanceBlock = addressData.block_number_balance_updated_at || "N/A";
        const hasTokenTransfers = addressData.has_token_transfers || false;
        const tokensCount = tokenData.items?.length || 0;
        let proxyImplementation = "N/A";

        if (addressData.implementations && addressData.implementations.length > 0) {
            proxyImplementation = addressData.implementations[0].address || "Unknown";
        }

        // Fetch transaction data to calculate gas used
        const txListResponse = await axios.get(`${API_URL}/addresses/${address}/transactions`);
        const txListData = txListResponse.data;

        let totalGasUsed = 0;
        let transfersCount = 0;

        for (const tx of txListData.items || []) {
            if (tx.gas_used) {
                totalGasUsed += parseInt(tx.gas_used, 10);
            }
            if (tx.method === "transfer") {
                transfersCount += 1;
            }
        }

        // Format output
        console.log(`Delegated to:      ${isContract ? proxyImplementation : "N/A"}`);
        console.log(`Balance:           ${balanceEth.toFixed(8)} ETH`);
        console.log(`Tokens:            ${tokensCount}`);
        console.log(`Net worth:         N/A`);
        console.log(`Transactions:      ${txCount}`);
        console.log(`Transfers:         ${hasTokenTransfers ? transfersCount : 0}`);
        console.log(`Gas used:          ${formatNumber(totalGasUsed)}`);
        console.log(`Last balance update: ${lastBalanceBlock}`);
        console.log(`Account Type:      ${isContract ? "Contract" : "EOA (Externally Owned Account)"}`);
    } catch (error) {
        console.error(`Error retrieving wallet info: ${error}`);
    }
}