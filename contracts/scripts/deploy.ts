import { ethers } from "hardhat";

async function main() {
    const ipfsMetadataURI = "ipfs://bafybeiewl4vgz2yhjhssnwnqtlivjyxe6m45utyfeu66oaukgeiljdheky/";
    const Registry = await ethers.getContractFactory("ReputationRegistry");
    const registry = await Registry.deploy(ipfsMetadataURI);
    await registry.waitForDeployment();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});