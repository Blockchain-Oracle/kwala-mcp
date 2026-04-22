import type { WorkflowTemplate } from "./types.js";

export const TEMPLATES: WorkflowTemplate[] = [
  {
    id: "token-transfer-alert",
    name: "Token Transfer Alert",
    description:
      "Get notified on Telegram when tokens are transferred on any supported chain. Watches for ERC-20 Transfer events.",
    category: "alerts",
    trigger_type: "event",
    actions: ["Telegram notification"],
    chains: ["any"],
    yaml: `Name: TokenTransferAlert
Trigger:
  TriggerSourceContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  TriggerChainID: 1
  TriggerEventName: "Transfer(address,address,uint256)"
  TriggerEventFilter: "NA"
  RepeatEvery: "event"
  ExecuteAfter: "event"
Actions:
  - Name: SendTelegramAlert
    Type: post
    APIEndpoint: "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage"
    APIPayload:
      chat_id: "<YOUR_CHAT_ID>"
      text: "USDC Transfer: from re.event(0) to re.event(1), amount: re.event(2)"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential`,
  },
  {
    id: "treasury-deposit-notifier",
    name: "Treasury Deposit Notifier",
    description:
      "Monitor any wallet for incoming transactions and send notifications to Discord. Uses address tracking trigger.",
    category: "monitoring",
    trigger_type: "address_tracking",
    actions: ["Discord webhook", "Backend webhook"],
    chains: ["Base"],
    yaml: `Name: TreasuryDepositNotifier
Trigger:
  TriggerSourceContract: "0xYourTreasuryAddress"
  TriggerChainID: 8453
  ExecuteAfter: "address_tracking"
  RepeatEvery: "address_tracking"
Actions:
  - Name: NotifyDiscord
    Type: post
    APIEndpoint: "https://discord.com/api/webhooks/<YOUR_WEBHOOK>"
    APIPayload:
      content: "Treasury activity detected! Tx: re.event(0)"
    RetriesUntilSuccess: 5
  - Name: LogToBackend
    Type: post
    APIEndpoint: "https://your-api.com/webhook/treasury"
    APIPayload:
      receipt: "re.event(0)"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential`,
  },
  {
    id: "oracle-price-alert",
    name: "Oracle Price Alert",
    description:
      "Get alerted when a token price drops below a threshold. Uses oracle price trigger.",
    category: "alerts",
    trigger_type: "oracle_price",
    actions: ["Telegram notification"],
    chains: ["any"],
    yaml: `Name: SOLPriceDropAlert
Trigger:
  TriggerPrice: 150.0
  ExecuteAfter: "oracle_price"
  RepeatEvery: "oracle_price"
  ExpiresIn: 2592000
Actions:
  - Name: AlertTelegram
    Type: post
    APIEndpoint: "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage"
    APIPayload:
      chat_id: "<YOUR_CHAT_ID>"
      text: "SOL has dropped below $150!"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential`,
  },
  {
    id: "address-tracker",
    name: "Address Tracker",
    description:
      "Track any wallet address for all activity and forward to a webhook. Captures full transaction receipts.",
    category: "monitoring",
    trigger_type: "address_tracking",
    actions: ["Webhook POST"],
    chains: ["Polygon"],
    yaml: `Name: WalletActivityTracker
Trigger:
  TriggerSourceContract: "0xWalletToTrack"
  TriggerChainID: 137
  ExecuteAfter: "address_tracking"
  RepeatEvery: "address_tracking"
  ExpiresIn: 604800
Actions:
  - Name: ForwardToWebhook
    Type: post
    APIEndpoint: "https://your-api.com/webhook/activity"
    APIPayload:
      type: "address_activity"
      receipt: "re.event(0)"
    RetriesUntilSuccess: 5
Execution:
  Mode: sequential`,
  },
  {
    id: "auto-topup-wallet",
    name: "Auto Top-Up Wallet",
    description:
      "Automatically transfer USDC when a low balance event is detected. Uses event trigger with contract call action.",
    category: "defi",
    trigger_type: "event",
    actions: ["USDC transfer", "Telegram notification"],
    chains: ["Base"],
    yaml: `Name: AutoTopUpWallet
Trigger:
  TriggerSourceContract: "0xBalanceCheckerContract"
  TriggerChainID: 8453
  TriggerEventName: "LowBalance(address,uint256)"
  TriggerEventFilter: "NA"
  RepeatEvery: "event"
  ExecuteAfter: "event"
Actions:
  - Name: TransferUSDC
    Type: call
    TargetContract: "0xUSDCContractAddress"
    TargetFunction: "function transfer(address to, uint256 amount)"
    TargetParams:
      - "re.event(0)"
      - "1000000"
    ChainID: 8453
    EncodedABI: "NA"
    Metadata: "NA"
    RetriesUntilSuccess: 3
  - Name: NotifyOwner
    Type: post
    APIEndpoint: "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage"
    APIPayload:
      chat_id: "<YOUR_CHAT_ID>"
      text: "Auto top-up sent 1 USDC to re.event(0)"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential`,
  },
  {
    id: "nft-reward-mint",
    name: "NFT Reward Mint",
    description:
      "Mint a reward NFT when a purchase exceeds a threshold. Uses event trigger with filter and contract call.",
    category: "nft",
    trigger_type: "event",
    actions: ["NFT mint", "Telegram notification"],
    chains: ["Polygon Amoy"],
    yaml: `Name: NFTRewardOnPurchase
Trigger:
  TriggerSourceContract: "0xShopContract"
  TriggerChainID: 80002
  TriggerEventName: "PurchaseCompleted(address buyer, uint256 amount)"
  TriggerEventFilter: "re.event(1) > 100"
  RepeatEvery: "event"
  ExecuteAfter: "event"
Actions:
  - Name: MintRewardNFT
    Type: call
    TargetContract: "0xRewardNFTContract"
    TargetFunction: "function mintReward(address to)"
    TargetParams:
      - "re.event(0)"
    ChainID: 80002
    EncodedABI: "NA"
    Metadata: "NA"
    RetriesUntilSuccess: 5
  - Name: NotifyBuyer
    Type: post
    APIEndpoint: "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage"
    APIPayload:
      chat_id: "<YOUR_CHAT_ID>"
      text: "Reward NFT minted for buyer re.event(0)!"
    RetriesUntilSuccess: 3
Execution:
  Mode: sequential`,
  },
];
