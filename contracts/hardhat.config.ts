import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    // Mạng Moonbase Alpha (Testnet của Moonbeam trên Polkadot)
    moonbase: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;