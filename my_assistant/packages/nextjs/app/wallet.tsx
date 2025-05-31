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
    // Get basic wallet info
    const balanceWei = BigInt(await ethRpc(network.rpc_url, "eth_getBalance", [address, "latest"]));
    const balanceEth = Number(balanceWei) / 10**18;

    const txCount = parseInt(await ethRpc(network.rpc_url, "eth_getTransactionCount", [address, "latest"]), 16);
    const code = await ethRpc(network.rpc_url, "eth_getCode", [address, "latest"]);
    const isContract = code !== "0x";

    // Get additional info from API
    const addressData = (await axios.get(`${network.api_url}/addresses/${address}`)).data;
    const tokenData = (await axios.get(`${network.api_url}/addresses/${address}/tokens`)).data;
    const txListData = (await axios.get(`${network.api_url}/addresses/${address}/transactions`)).data;

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
    throw error;
  }
}

export async function analyzeWallet(userInput: string): Promise<string> {
  const address = userInput.split(' ').pop()!;
  let result = "";

  for (const network of NETWORKS) {
    try {
      const info = await getWalletInfo(network, address);
      result += `
Wallet Information (${network.name})
Address:           ${address}
Delegated to:      ${info.delegatedTo}
Balance:           ${info.balance}
Tokens:            ${info.tokens}
Transactions:      ${info.transactions}
Transfers:         ${info.transfers}
Gas used:          ${info.gasUsed}
Last balance update: ${info.lastBalanceUpdate}
Account Type:      ${info.accountType}

`;
    } catch (error) {
      result += `\nError checking ${network.name}: ${error}\n`;
    }
  }

  return result.trim();
}
