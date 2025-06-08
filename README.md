# Blockchain Analysis Assistant 🐀

A chat application with blockchain analysis capabilities that helps analyze transactions and wallet information while providing a conversational interface.

## Commands

### Transaction Analysis

The application provides transaction details across multiple networks (Sepolia Testnet, Rootstock Testnet) using:

```
identify [transaction-hash]
```

Example: `identify 0x1234...5678`

This command displays:
- Transaction status
- Block number
- Sender/receiver addresses
- Value transferred
- Gas used and price

### Wallet Analysis

Get detailed wallet information using:

```
wallet [wallet-address]
```

Example: `wallet 0xabcd...ef12`

This command provides:
- Current balance
- Number of tokens
- Transaction count
- Account type (EOA or Contract)
- Gas usage statistics

## Wallet Scaffolding

The application provides wallet scaffolding capabilities that enable rapid development and analysis of blockchain wallets. The scaffold structure includes:

- Multi-network support for wallet analysis
- Contract detection and implementation checking
- Token balance aggregation across networks
- Transaction history compilation
- Gas usage statistics calculation

The wallet scaffolding layer abstracts complex blockchain interactions to provide consistent data structures for analysis across different networks.

## Natural Language Processing

The DeepSeek API automatically detects when users ask about blockchain data in natural language and executes the appropriate command. Users can simply ask questions like:

"What can you tell me about this transaction: 0x1234...5678?"

The system will understand the intent and run the appropriate blockchain analysis command, then provide both raw data and a simplified explanation.
