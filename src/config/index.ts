import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Get projectId from environment variables with fallback
export const projectId = `ff7e4c6da87929d965ceb31b6a72924c`;

export const avalancheFuji = {
  id: 43113,
  name: "Avalanche Fuji C-Chain",
  chainNamespace: "eip155",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
      webSocket: ["wss://api.avax-test.network/ext/bc/C/ws"],
    },
    public: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
      webSocket: ["wss://api.avax-test.network/ext/bc/C/ws"],
    },
  },
  blockExplorers: {
    default: {
      name: "Avalanche Fuji Explorer",
      url: "https://subnets-test.avax.network/c-chain",
    },
  },
};

export const networks = [avalancheFuji];

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
