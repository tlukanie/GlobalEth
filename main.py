import sys
import requests

RPC_URL = "https://eth-sepolia.blockscout.com/api/eth-rpc"
HEADERS = {"Content-Type": "application/json"}

def eth_rpc(method, params):
    """Helper to do a JSON-RPC POST to Blockscout."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    }
    resp = requests.post(RPC_URL, json=payload, headers=HEADERS)
    resp.raise_for_status()
    return resp.json().get("result")

def cmd_identify(args):
    if not args:
        print("Usage: identify [tx_hash]")
        return

    tx_hash = args[0]
    print(f"🔍  Looking up: {tx_hash}\n")

    # 1) Fetch the transaction object
    tx = eth_rpc("eth_getTransactionByHash", [tx_hash])
    if tx is None:
        print("❌ Transaction not found or not yet indexed.")
        return

    # 2) Fetch its receipt
    receipt = eth_rpc("eth_getTransactionReceipt", [tx_hash]) or {}

    # parse and convert
    status     = receipt.get("status", "0x0")
    block_num  = int(tx.get("blockNumber", "0x0"), 16)
    frm        = tx.get("from")
    to         = tx.get("to")
    value_wei  = int(tx.get("value", "0x0"), 16)
    gas_used   = int(receipt.get("gasUsed", "0x0"), 16)
    gas_limit  = int(tx.get("gas", "0x0"), 16)
    gas_price  = int(tx.get("gasPrice", "0x0"), 16)
    fee_wei    = gas_used * gas_price

    print(f"Transaction:   {tx_hash}")
    print(f"Status:        {'Success' if status=='0x1' else 'Failed'}")
    print(f"Block:         {block_num}")
    print(f"From:          {frm}")
    print(f"To:            {to}")
    print(f"Value:         {value_wei / 10**18:.6f} ETH")
    print(f"Gas used:      {gas_used} / {gas_limit}")
    print(f"Gas price:     {gas_price / 10**9:.2f} Gwei")
    print(f"Fee:           {fee_wei / 10**18:.6f} ETH")

def cmd_help():
    print("Commands:")
    print("  identify [hash]  – lookup Sepolia tx")
    print("  help             – this menu")
    print("  exit             – quit")

COMMANDS = {
    "identify": cmd_identify,
    "i": cmd_identify,
    "help":     lambda args=None: cmd_help(),
    "exit":     lambda args=None: sys.exit(0),
}

def main():
    print("Sepolia Tx Inspector (Blockscout JSON-RPC)")  # using /api/eth-rpc
    print("Type 'help' for commands\n")
    while True:
        try:
            raw = input("> ").strip()
            if not raw:
                continue
            parts = raw.split()
            cmd, args = parts[0], parts[1:]
            if cmd in COMMANDS:
                COMMANDS[cmd](args)
            else:
                print(f"Unknown command: {cmd!r}")
        except (KeyboardInterrupt, EOFError):
            print()
            break

if __name__ == "__main__":
    main()
