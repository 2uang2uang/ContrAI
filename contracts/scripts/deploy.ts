import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🚀 Đang triển khai bằng tài khoản:", deployer.address);

    // 1. Triển khai Registry (Cổng quản lý chính)
    const Registry = await ethers.getContractFactory("ReputationRegistry");
    const registry = await Registry.deploy("https://api.example.com/badge/"); // Badge base URI
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log(`✅ ReputationRegistry: ${registryAddress}`);

    // 2. Triển khai Badge (NFT Soulbound) - Cần địa chỉ Registry
    const Badge = await ethers.getContractFactory("ReputationBadge");
    const badge = await Badge.deploy(registryAddress, "https://api.example.com/badge/");
    await badge.waitForDeployment();
    console.log(`✅ ReputationBadge: ${await badge.getAddress()}`);

    // 3. Triển khai Storage - Cần địa chỉ Registry
    const Storage = await ethers.getContractFactory("ReputationStorage");
    const storage = await Storage.deploy(registryAddress);
    await storage.waitForDeployment();
    console.log(`✅ ReputationStorage: ${await storage.getAddress()}`);

    console.log("\n🎉 Triển khai hoàn tất! Hãy lưu lại các địa chỉ Contract trên.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});