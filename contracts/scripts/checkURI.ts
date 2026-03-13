import { ethers } from "hardhat";

async function main() {
    // Điền địa chỉ Badge mới nhất của bạn vào đây (Lấy từ log deploy)
    const badgeAddress = "0xa96B4901e40f76bcEf762cd24E31610ACBC3e894";

    const badge = await ethers.getContractAt("ReputationBadge", badgeAddress);

    console.log("🔍 Đang kiểm tra Contract...");
    const baseURI = await badge.baseURI();
    console.log("👉 Base URI hiện tại là:", baseURI);

    try {
        const tokenURI = await badge.tokenURI(1); // Kiểm tra thử Token ID 1
        console.log("👉 Token URI của ID 1 là:", tokenURI);
    } catch (e) {
        console.log("Chưa có ai Mint token ID 1.");
    }
}

main().catch(console.error);