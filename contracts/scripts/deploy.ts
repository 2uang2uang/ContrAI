import { ethers } from "hardhat";

async function main() {
    console.log("Starting deployment...");
    
    const ipfsMetadataURI = "ipfs://bafybeiewl4vgz2yhjhssnwnqtlivjyxe6m45utyfeu66oaukgeiljdheky/";
    console.log("IPFS Metadata URI:", ipfsMetadataURI);
    
    const Registry = await ethers.getContractFactory("ReputationRegistry");
    console.log("Deploying ReputationRegistry...");
    
    const registry = await Registry.deploy(ipfsMetadataURI);
    await registry.waitForDeployment();
    
    const registryAddress = await registry.getAddress();
    
    // Get badge address from registry
    const badgeAddress = await registry.badge();
    
    console.log("✅ ReputationRegistry deployed successfully!");
    console.log("📍 REGISTRY_ADDRESS:", registryAddress);
    console.log("🏆 BADGE_ADDRESS:", badgeAddress);
    console.log("🌐 Network:", "paseoAssetHub");
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
}); 