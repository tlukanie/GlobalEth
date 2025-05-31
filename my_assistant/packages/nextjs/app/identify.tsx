import axios from 'axios';

interface Network {
  name: string;
  rpc_url: string;
  explorer_url: string;
}

interface TransactionResult {
  network: Network;
  tx: any;
  receipt: any;
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
    method,
    params
  };

  try {
    const response = await axios.post(url, payload, {
      headers: HEADERS,
      timeout: 5000
    });
    const data = response.data as { result: any };
    return data.result;
  } catch (error) {
    console.error('RPC Error:', error);
    return null;
  }
}

async function checkTransactionInNetwork(network: Network, txHash: string): Promise<TransactionResult | null> {
  const tx = await ethRpc(network.rpc_url, "eth_getTransactionByHash", [txHash]);
  if (!tx) return null;

  const receipt = await ethRpc(network.rpc_url, "eth_getTransactionReceipt", [txHash]) || {};
  return { network, tx, receipt };
}

export async function identifyTransaction(userInput: string): Promise<string> {

    const txHash = userInput.split(' ').pop()!; // Get last word as hash
    let result: TransactionResult | null = null;

    // Check all networks
    for (const network of NETWORKS) {
      result = await checkTransactionInNetwork(network, txHash);
      if (result) break;
    }

    if (!result) {
      return "Transaction not found in any supported network.";
    }

    const { tx, receipt, network } = result;

    const status = receipt?.status || "0x0";
    const blockNum = parseInt(tx?.blockNumber || "0x0", 16);
    const from = tx?.from;
    const to = tx?.to;
    const valueWei = BigInt(tx?.value || "0x0");
    const gasUsed = BigInt(receipt?.gasUsed || "0x0");
    const gasLimit = BigInt(tx?.gas || "0x0");
    const gasPrice = BigInt(tx?.gasPrice || "0x0");
    const feeWei = gasUsed * gasPrice;

    return `
Transaction Details (${network.name})
Transaction:   ${txHash}
Status:        ${status === "0x1" ? "Success" : "Failed"}
Block:         ${blockNum}
From:          ${from}
To:            ${to}
Value:         ${Number(valueWei) / 10**18} ETH
Gas used:      ${gasUsed.toString()} / ${gasLimit.toString()}
Gas price:     ${Number(gasPrice) / 10**9} Gwei
Fee:           ${Number(feeWei) / 10**18} ETH
Explorer URL:  ${network.explorer_url}/${txHash}
    `.trim();
}
