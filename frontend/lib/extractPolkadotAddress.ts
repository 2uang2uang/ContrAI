import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';

export const extractPolkadotAddress = (address: string): string => {
  try {
    return encodeAddress(
      isHex(address) ? hexToU8a(address) : decodeAddress(address)
    );
  } catch (error) {
    return address;
  }
};