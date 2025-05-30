import sys

def cmd_identify(args):
    """
    Stub for the command identify [hash]
    Implement hash processing logic here
    """
    if not args:
        print("Usage: identify [hash]")
        return
    hash_value = args[0]
    print(f"Identifying hash: {hash_value}")
    # TODO: add real logic here


def cmd_help(args=None):
    """
    Display help information for available commands
    """
    print("Available commands:")
    print("  identify [hash]  - identify information based on the hash")
    print("  help             - show this help message")
    print("  exit             - exit the program")


COMMANDS = {
    'identify': cmd_identify,
    'help': cmd_help,
    'exit': lambda args: sys.exit(0),
}


def main():
    """
    Main loop: prompt user for commands
    """
    while True:
        try:
            # Display prompt and read input
            user_input = input('> ').strip()
            if not user_input:
                continue

            parts = user_input.split()
            cmd, args = parts[0], parts[1:]

            # Find and execute the corresponding function
            func = COMMANDS.get(cmd)
            if func:
                func(args)
            else:
                print(f"Unknown command: {cmd}. Type 'help' for a list of commands.")

        except (KeyboardInterrupt, EOFError):
            print()  # newline on Ctrl+C or EOF
            break

if __name__ == '__main__':
    main()
