import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Get projectId from environment variables with fallback
export const projectId = `ff7e4c6da87929d965ceb31b6a72924c`;

export const flowTestnet = {
  id: 545,
  name: "Flow EVM Testnet",
  chainNamespace: "eip155",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://testnet.evm.nodes.onflow.org/"]
    },
    public: {
      http: ["https://testnet.evm.nodes.onflow.org/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Flow Testnet Explorer",
      url: "https://evm-testnet.flowscan.io/",
    },
  },
};

export const networks = [flowTestnet];

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
