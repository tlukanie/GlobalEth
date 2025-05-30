import sys
import requests

def cmd_identify(args):
    """Process a transaction hash and display information"""
    if not args:
        print("Usage: identify [hash]")
        return

    hash_value = args[0]
    print(f"Fetching information for transaction: {hash_value}")

    api_url = f"https://eth-sepolia.blockscout.com/api/v2/transactions/{hash_value}"

    try:
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()

        if 'data' not in data:
            print(f"Error: Transaction not found")
            return

        tx = data['data']

        # Print essential information
        print(f"\nTransaction: {tx['hash']}")
        print(f"Status: {tx['status']}")
        print(f"Block: {tx['block']}")
        print(f"From: {tx['from']['hash']}")
        print(f"To: {tx['to']['hash']}")
        print(f"Value: {float(tx['value']) / 10**18:.6f} ETH")
        print(f"Gas used: {tx['gas_used']} / {tx['gas_limit']}")
        print(f"Fee: {float(tx['fee']['value']) / 10**18:.6f} ETH")

    except Exception as e:
        print(f"Error: {e}")

def cmd_help():
    """Display help information"""
    print("Available commands:")
    print("  identify [hash] - get transaction info")
    print("  help - show help")
    print("  exit - exit program")

COMMANDS = {
    'identify': cmd_identify,
    'help': cmd_help,
    'exit': lambda args: sys.exit(0),
}

def main():
    """Main command loop"""
    print("Sepolia Transaction Hash Identifier")
    print("Type 'help' for commands")

    while True:
        try:
            user_input = input('> ').strip()
            if not user_input:
                continue

            parts = user_input.split()
            cmd, args = parts[0], parts[1:]

            if cmd in COMMANDS:
                COMMANDS[cmd](args)
            else:
                print(f"Unknown command: {cmd}")

        except (KeyboardInterrupt, EOFError):
            break

if __name__ == '__main__':
    main()
