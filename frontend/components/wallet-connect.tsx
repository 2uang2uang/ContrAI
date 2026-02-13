"use client";

import { useState } from 'react';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { Button } from "@/components/ui/button";

export const WalletConnect = () => {
  const [address, setAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    // 1. Kích hoạt kết nối với extension (giống cơ chế Luno Kit)
    const extensions = await web3Enable('MyContrAIApp');
    if (extensions.length === 0) {
      alert("Vui lòng cài đặt ví Polkadot (Talisman hoặc Polkadot.js)");
      return;
    }

    // 2. Lấy danh sách tài khoản
    const allAccounts = await web3Accounts();
    if (allAccounts.length > 0) {
      setAddress(allAccounts[0].address);
      console.log("Đã kết nối ví:", allAccounts[0].address);
    }
  };

  return (
    <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
      {address ? `Đã kết nối: ${address.slice(0, 6)}...` : "Kết nối ví Polkadot"}
    </Button>
  );
};