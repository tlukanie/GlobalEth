import sys
from commands.identify import cmd_identify
from commands.help import cmd_help
from commands.wallet import cmd_wallet

COMMANDS = {
    "identify": cmd_identify,
    "i": cmd_identify,
    "wallet": cmd_wallet,
    "w": cmd_wallet,
    "help": lambda args=None: cmd_help(),
    "exit": lambda args=None: sys.exit(0),
}

def main():
    print("Type 'help' for commands")
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
