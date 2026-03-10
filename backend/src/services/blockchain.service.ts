import { ethers } from 'ethers';

export async function generateMintSignature(
  userAddress: string,
  score: number,
  tier: number
) {
  const privKey = process.env.ORACLE_PRIVATE_KEY || "";
  const wallet = new ethers.Wallet(privKey);

  // Tạo hash của thông điệp theo chuẩn Smart Contract yêu cầu
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "uint8"],
    [userAddress, score, tier]
  );
  
  // Ký hash bằng Private Key của Oracle
  const signature = await wallet.signMessage(ethers.toBeArray(messageHash));
  
  return signature;
}