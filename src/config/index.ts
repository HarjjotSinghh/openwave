import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Get projectId from environment variables with fallback
export const projectId = `ff7e4c6da87929d965ceb31b6a72924c`;

export const AVAXTestnet = {
  id: 545,
  name: "AVAX EVM Testnet",
  chainNamespace: "eip155",
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://testnet.evm.nodes.onAVAX.org/"]
    },
    public: {
      http: ["https://testnet.evm.nodes.onAVAX.org/"],
    },
  },
  blockExplorers: {
    default: {
      name: "AVAX Testnet Explorer",
      url: "https://evm-testnet.AVAXscan.io/",
    },
  },
};

export const avalancheTestnet = {
  id: 43113,
  name: "Avalanche Fuji C-Chain",
  chainNamespace: "eip155",
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"]
    },
    public: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Avalanche Testnet Scan",
      url: "https://subnets-test.avax.network/c-chain",
    },
  },
}

export const networks = [AVAXTestnet,avalancheTestnet];

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId: projectId || "demo-project-id", // Ensure we always have a fallback
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
