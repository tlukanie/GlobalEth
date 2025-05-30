import requests

RPC_URL = "https://eth-sepolia.blockscout.com/api/eth-rpc"
API_URL = "https://eth-sepolia.blockscout.com/api/v2"
HEADERS = {"Content-Type": "application/json"}

def eth_rpc(method, params):
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    }
    resp = requests.post(RPC_URL, json=payload, headers=HEADERS)
    resp.raise_for_status()
    return resp.json().get("result")

def format_number(num):
    if isinstance(num, (int, float)):
        return f"{num:,}"
    return num

def cmd_wallet(args):
    if not args:
        print("Usage: wallet [address]")
        return

    address = args[0]
    print(f"\nWallet Information for: {address}\n")

    try:
        balance_wei = int(eth_rpc("eth_getBalance", [address, "latest"]), 16)
        balance_eth = balance_wei / 10**18

        tx_count = int(eth_rpc("eth_getTransactionCount", [address, "latest"]), 16)

        code = eth_rpc("eth_getCode", [address, "latest"])
        is_contract = code != "0x"

        response = requests.get(f"{API_URL}/addresses/{address}")
        response.raise_for_status()
        address_data = response.json()

        token_response = requests.get(f"{API_URL}/addresses/{address}/tokens")
        token_response.raise_for_status()
        token_data = token_response.json()

        # Extract information from the API responses
        last_balance_block = address_data.get("block_number_balance_updated_at", "N/A")
        has_token_transfers = address_data.get("has_token_transfers", False)
        tokens_count = len(token_data.get("items", []))
        proxy_implementation = "N/A"

        if address_data.get("implementations"):
            implementations = address_data.get("implementations", [])
            if implementations and len(implementations) > 0:
                proxy_implementation = implementations[0].get("address", "Unknown")

        # Get transaction data to calculate gas used
        tx_list_response = requests.get(f"{API_URL}/addresses/{address}/transactions")
        tx_list_response.raise_for_status()
        tx_list_data = tx_list_response.json()

        total_gas_used = 0
        transfers_count = 0

        for tx in tx_list_data.get("items", []):
            if "gas_used" in tx:
                total_gas_used += int(tx.get("gas_used", 0))
            if tx.get("method") == "transfer":
                transfers_count += 1

        # Format output
        print(f"Delegated to:      {proxy_implementation if is_contract else 'N/A'}")
        print(f"Balance:           {balance_eth:.8f} ETH")
        print(f"Tokens:            {tokens_count}")
        print(f"Net worth:         N/A")
        print(f"Transactions:      {tx_count}")
        print(f"Transfers:         {transfers_count if has_token_transfers else 0}")
        print(f"Gas used:          {format_number(total_gas_used)}")
        print(f"Last balance update: {last_balance_block}")
        print(f"Account Type:      {'Contract' if is_contract else 'EOA (External Owned Account)'}")

    except Exception as e:
        print(f"Error retrieving wallet info: {e}")
