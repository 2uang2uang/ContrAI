import { ethers } from 'ethers';

export async function generateMintSignature(
  userAddress: string,
  compositePct: number,
  snapshotBlock: number
) {
  const privKey = process.env.ORACLE_PRIVATE_KEY || "";
  const registryAddress = process.env.REPUTATION_REGISTRY_ADDRESS || "";
  const wallet = new ethers.Wallet(privKey);

  // Kết nối với provider để lấy nonce từ contract
  const provider = new ethers.JsonRpcProvider("https://services.polkadothub-rpc.com/testnet");

  // ABI để lấy nonce
  const registryAbi = [
    "function nonces(address) external view returns (uint256)"
  ];

  const registryContract = new ethers.Contract(registryAddress, registryAbi, provider);
  const nonce = await registryContract.nonces(userAddress);

  // Cấu hình Domain chuẩn EIP-712 khớp với Registry
  const domain = {
    name: "PolkadotReputationRegistry",
    version: "1",
    chainId: 420420417, // Sửa chainId cho khớp với hardhat config
    verifyingContract: registryAddress
  };

  const types = {
    ScoreData: [
      { name: "wallet", type: "address" },
      { name: "compositePct", type: "uint256" },
      { name: "governancePct", type: "uint256" },
      { name: "economicPct", type: "uint256" },
      { name: "identityPct", type: "uint256" },
      { name: "socialPct", type: "uint256" },
      { name: "snapshotBlock", type: "uint256" },
      { name: "nonce", type: "uint256" }
    ]
  };

  const value = {
    wallet: userAddress,
    compositePct: Math.floor(compositePct), // Đảm bảo là số nguyên [cite: 107]
    governancePct: 0,
    economicPct: 0,
    identityPct: 0,
    socialPct: 0,
    snapshotBlock: snapshotBlock,
    nonce: nonce.toString()
  };

  return await wallet.signTypedData(domain, types, value);
}