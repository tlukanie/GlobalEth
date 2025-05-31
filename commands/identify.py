import requests

# 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


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
    tx = eth_rpc(network["rpc_url"], "eth_getTransactionByHash", [tx_hash])
    if tx is None:
        return None

    receipt = eth_rpc(network["rpc_url"], "eth_getTransactionReceipt", [tx_hash]) or {}
    return {"network": network, "tx": tx, "receipt": receipt}

def identify_intent(user_input):
    """Use Hugging Face API to identify intent."""
    api_url = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
    headers = {"Authorization": f"Bearer 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"}
    payload = {
        "inputs": user_input,
        "parameters": {"candidate_labels": ["wallet", "transaction"]}
    }
    try:
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        return result["labels"][0]  # Return the top label
    except Exception as e:
        print(f"Error identifying intent: {e}")
        return None

def cmd_identify(args):
    if not args:
        print("Usage: identify [query]")
        return

    user_input = " ".join(args)
    intent = identify_intent(user_input)

    if intent == "transaction":
        tx_hash = user_input.split()[-1]  # Assume the transaction hash is the last word
        print(f"Looking up transaction: {tx_hash}")

        result = None
        for network in NETWORKS:
            print(f"Checking {network['name']}...")
            result = check_transaction_in_network(network, tx_hash)
            if result:
                print(f"Transaction found on {network['name']}!")
                break

        if not result:
            print("Transaction not found in any supported network.")
            return

        tx = result["tx"]
        receipt = result["receipt"]
        network = result["network"]

        status = receipt.get("status", "0x0")
        block_num = int(tx.get("blockNumber", "0x0"), 16)
        frm = tx.get("from")
        to = tx.get("to")
        value_wei = int(tx.get("value", "0x0"), 16)
        gas_used = int(receipt.get("gasUsed", "0x0"), 16)
        gas_limit = int(tx.get("gas", "0x0"), 16)
        gas_price = int(tx.get("gasPrice", "0x0"), 16)
        fee_wei = gas_used * gas_price

        print(f"\nTransaction Details ({network['name']})")
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

    elif intent == "wallet":
        print("Wallet lookup is not implemented yet.")
        # Add wallet lookup logic here
    else:
        print("Could not determine intent. Please specify if it's a wallet or transaction query.")