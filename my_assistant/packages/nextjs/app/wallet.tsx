import axios from 'axios';

interface Network {
	name: string;
	rpc_url: string;
	api_url: string;
}

interface WalletInfo {
	balance: string;
	tokens: number;
	transactions: number;
	transfers: number;
	gasUsed: string;
	lastBalanceUpdate: string;
	accountType: string;
	delegatedTo: string;
}

const NETWORKS: Network[] = [
	{
		name: "Sepolia Testnet",
		rpc_url: "https://eth-sepolia.blockscout.com/api/eth-rpc",
		api_url: "https://eth-sepolia.blockscout.com/api/v2"
	},
	{
		name: "Rootstock Testnet",
		rpc_url: "https://rootstock-testnet.blockscout.com/api/eth-rpc",
		api_url: "https://rootstock-testnet.blockscout.com/api/v2"
	}
];

const HEADERS = { "Content-Type": "application/json" };

async function ethRpc(url: string, method: string, params: any[]): Promise<any> {
	const payload = {
		jsonrpc: "2.0",
		id: 1,
		method,
		params
	};

	const response = await axios.post(url, payload, { headers: HEADERS });
	return response.data.result;
}

function formatNumber(num: number | string): string {
	return new Intl.NumberFormat().format(Number(num));
}

async function getWalletInfo(network: Network, address: string): Promise<WalletInfo> {
	try {
		// Run all RPC calls in parallel
		const [balanceResponse, txCountResponse, code] = await Promise.all([
			ethRpc(network.rpc_url, "eth_getBalance", [address, "latest"]),
			ethRpc(network.rpc_url, "eth_getTransactionCount", [address, "latest"]),
			ethRpc(network.rpc_url, "eth_getCode", [address, "latest"])
		]);

		// Check if balance response is valid
		if (!balanceResponse) {
			throw new Error("Invalid balance response from RPC");
		}

		const balanceWei = BigInt(balanceResponse || "0x0");
		const balanceEth = Number(balanceWei) / 10 ** 18;
		const txCount = parseInt(txCountResponse || "0x0", 16);
		const isContract = code !== "0x";

		// Run all API calls in parallel
		const [addressDataRes, tokenDataRes, txListDataRes] = await Promise.all([
			axios.get(`${network.api_url}/addresses/${address}`).catch(() => ({ data: { implementations: [], block_number_balance_updated_at: "N/A" } })),
			axios.get(`${network.api_url}/addresses/${address}/tokens`).catch(() => ({ data: { items: [] } })),
			axios.get(`${network.api_url}/addresses/${address}/transactions`).catch(() => ({ data: { items: [] } }))
		]);

		const addressData = addressDataRes.data;
		const tokenData = tokenDataRes.data;
		const txListData = txListDataRes.data;

		// Calculate totals
		let totalGasUsed = 0;
		let transfersCount = 0;

		for (const tx of txListData.items || []) {
			if (tx.gas_used) {
				totalGasUsed += parseInt(tx.gas_used);
			}
			if (tx.method === "transfer") {
				transfersCount++;
			}
		}

		// Get proxy implementation if contract
		let delegatedTo = "N/A";
		if (isContract && addressData.implementations?.length > 0) {
			delegatedTo = addressData.implementations[0].address || "Unknown";
		}

		return {
			balance: `${balanceEth.toFixed(8)} ETH`,
			tokens: tokenData.items?.length || 0,
			transactions: txCount,
			transfers: transfersCount,
			gasUsed: formatNumber(totalGasUsed),
			lastBalanceUpdate: addressData.block_number_balance_updated_at || "N/A",
			accountType: isContract ? "Contract" : "EOA (External Owned Account)",
			delegatedTo
		};
	} catch (error) {
		console.error("Error getting wallet info:", error);
		throw new Error(`Failed to get wallet info: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}
export async function analyzeWallet(userInput: string): Promise<string> {
	const address = userInput.split(' ').pop()!;
	let result = "";

	// Run all network checks in parallel
	const networkPromises = NETWORKS.map(async (network) => {
		try {
			const info = await getWalletInfo(network, address);

			// Check if the wallet has meaningful activity on this network
			// (non-zero balance, transactions, or tokens)
			const isActive =
				info.balance !== "0.00000000 ETH" &&
				(info.transactions > 0 || info.tokens > 0);

			return {
				network: network.name,
				success: true,
				isActive,
				info
			};
		} catch (error) {
			return {
				network: network.name,
				success: false,
				isActive: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	});

	// Wait for all network checks to complete
	const results = await Promise.all(networkPromises);

	// Filter to only show active networks
	const activeNetworks = results.filter(res => res.isActive);

	// If no active networks found, show a different message
	if (activeNetworks.length === 0) {
		result = `Address ${address} was not found or has no activity on any of the supported networks.`;

		// But if we have a contract account on any network, show that
		const contractNetworks = results.filter(res =>
			res.success && res.info.accountType.includes("Contract")
		);

		if (contractNetworks.length > 0) {
			result += "\n\nThis address appears to be a contract on these networks:";
			for (const net of contractNetworks) {
				result += `\n- ${net.network}`;
			}
		}
	} else {
		// Format results for active networks only
		for (const res of activeNetworks) {
			if (res.success) {
				const info = res.info;
				result += `
Wallet Information (${res.network})
Address:           ${address}
${info.accountType === "Contract" ? `Delegated to:      ${info.delegatedTo}\n` : ''}Balance:           ${info.balance}
Tokens:            ${info.tokens}
Transactions:      ${info.transactions}
Transfers:         ${info.transfers}
Gas used:          ${info.gasUsed}
Last balance update: ${info.lastBalanceUpdate}
Account Type:      ${info.accountType}

`;
			}
		}
	}

	return result.trim();
}
