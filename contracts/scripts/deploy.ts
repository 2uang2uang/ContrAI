import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🚀 Deploying with account:", deployer.address);

    // 1. Chỉ deploy Registry và nạp link thư mục JSON trên IPFS
    const ipfsMetadataURI = "ipfs://bafybeiewl4vgz2yhjhssnwnqtlivjyxe6m45utyfeu66oaukgeiljdheky/";

    const Registry = await ethers.getContractFactory("ReputationRegistry");
    const registry = await Registry.deploy(ipfsMetadataURI);

    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();

    // 2. Lấy địa chỉ Badge và Storage mà Registry đã tự tạo ra (CHUẨN NHẤT)
    const badgeAddress = await registry.badge();
    const storageAddress = await registry.scoreStorage();

    console.log("\n✅ DEPLOY SUCCESS (IPFS READY)");

    console.log("--------------------------------");
    console.log("Registry :", registryAddress);
    console.log("Badge    :", badgeAddress);
    console.log("Storage  :", storageAddress);
    console.log("Base URI :", ipfsMetadataURI);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});