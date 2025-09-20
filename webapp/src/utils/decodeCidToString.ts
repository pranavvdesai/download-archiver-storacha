import { CID } from 'multiformats/cid';

export function decodeCidToString(cid: Uint8Array | Record<string, number> | string): string {
  try {
    if (cid instanceof Uint8Array) {
      return CID.decode(cid).toString();
    }
    if (typeof cid === 'object' && cid !== null) {
      const bytes = new Uint8Array(Object.values(cid));
      return CID.decode(bytes).toString();
    }
    if (typeof cid === 'string') {
      return cid;
    }
  } catch (err) {
    console.error('Failed to decode CID:', err);
  }
  return '';
}
