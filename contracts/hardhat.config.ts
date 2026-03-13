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
    paseoAssetHub: {
      url: "https://services.polkadothub-rpc.com/testnet", // Thử endpoint mới
      chainId: 420420417, // Chain ID chính xác cho Paseo Asset Hub
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;