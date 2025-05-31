import re
from commands.identify import cmd_identify
from commands.wallet import cmd_wallet

def parse_and_route_command(user_input):
    """Parse user input and route to the appropriate command."""
    user_input = user_input.lower().strip()

    # Check for transaction-related keywords
    if re.search(r'\b(transaction|tx|check|txid|trans)\b', user_input):
        # Extract arguments (e.g., transaction hash)
        args = user_input.split()
        cmd_identify(args[1:])  # Pass the transaction hash to cmd_identify

    # Check for wallet-related keywords
    elif re.search(r'\b(wallet|address|account|wall|find)\b', user_input):
        # Extract arguments (e.g., wallet address)
        args = user_input.split()
        cmd_wallet(args[1:])  # Pass the wallet address to cmd_wallet

    else:
        print("Unknown command. Please specify 'transaction' or 'wallet'.")

# Example usage
if __name__ == "__main__":
    print("Type 'exit' to quit the program.")
    while True:
        # Prompt the user for input
        user_input = input("> ").strip()

        # Exit condition
        if user_input.lower() == "exit":
            print("Exiting the program. Goodbye!")
            break

        # Process the input
        parse_and_route_command(user_input)