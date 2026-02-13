import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';

export const extractPolkadotAddress = (address: string): string => {
  try {
    // Giải mã và mã hóa lại để đảm bảo đúng định dạng chuẩn Polkadot
    return encodeAddress(
      isHex(address) ? hexToU8a(address) : decodeAddress(address)
    );
  } catch (error) {
    console.error("Địa chỉ ví không hợp lệ:", error);
    return address;
  }
};