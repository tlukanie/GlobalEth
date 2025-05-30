import requests

NETWORKS = [
    {
        "name": "Sepolia Testnet",
        "rpc_url": "https://eth-sepolia.blockscout.com/api/eth-rpc",
        "explorer_url": "https://eth-sepolia.blockscout.com/tx"
    },
    {
        "name": "Rootstock Testnet",
        "rpc_url": "https://rootstock-testnet.blockscout.com/api/eth-rpc",
        "explorer_url": "https://rootstock-testnet.blockscout.com/tx"
    }
]

HEADERS = {"Content-Type": "application/json"}

def eth_rpc(url, method, params):
    """Helper to do a JSON-RPC POST to a blockchain API."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    }
    try:
        resp = requests.post(url, json=payload, headers=HEADERS, timeout=5)
        resp.raise_for_status()
        return resp.json().get("result")
    except (requests.RequestException, ValueError):
        return None

def check_transaction_in_network(network, tx_hash):
    """Check if a transaction exists in a specific network."""
    tx = eth_rpc(network["rpc_url"], "eth_getTransactionByHash", [tx_hash])
    if tx is None:
        return None

    receipt = eth_rpc(network["rpc_url"], "eth_getTransactionReceipt", [tx_hash]) or {}

    return {
        "network": network,
        "tx": tx,
        "receipt": receipt
    }

def cmd_identify(args):
    if not args:
        print("Usage: identify [tx_hash]")
        return

    tx_hash = args[0]
    print(f"\n🔍 Looking up transaction: {tx_hash}")

    # Try each network until we find the transaction
    result = None
    for network in NETWORKS:
        print(f"Checking {network['name']}...")
        result = check_transaction_in_network(network, tx_hash)
        if result:
            print(f"✅ Transaction found on {network['name']}!")
            break

    if not result:
        print("❌ Transaction not found in any supported network.")
        return

    # Extract transaction details
    tx = result["tx"]
    receipt = result["receipt"]
    network = result["network"]

    status     = receipt.get("status", "0x0")
    block_num  = int(tx.get("blockNumber", "0x0"), 16)
    frm        = tx.get("from")
    to         = tx.get("to")
    value_wei  = int(tx.get("value", "0x0"), 16)
    gas_used   = int(receipt.get("gasUsed", "0x0"), 16)
    gas_limit  = int(tx.get("gas", "0x0"), 16)
    gas_price  = int(tx.get("gasPrice", "0x0"), 16)
    fee_wei    = gas_used * gas_price

    # Display transaction details
    print(f"\n--- Transaction Details ({network['name']}) ---")
    print(f"Transaction:   {tx_hash}")
    print(f"Status:        {'Success' if status=='0x1' else 'Failed'}")
    print(f"Block:         {block_num}")
    print(f"From:          {frm}")
    print(f"To:            {to}")
    print(f"Value:         {value_wei / 10**18:.6f} ETH")
    print(f"Gas used:      {gas_used} / {gas_limit}")
    print(f"Gas price:     {gas_price / 10**9:.2f} Gwei")
    print(f"Fee:           {fee_wei / 10**18:.6f} ETH")
    print(f"Explorer URL:  {network['explorer_url']}/{tx_hash}")
