/** Object storage is swappable until the hosting decision is made. Never store credentials in the client. */
export interface ObjectStorage {
  put(key: string, data: Uint8Array, contentType: string): Promise<void>;
  signedReadUrl(key: string): Promise<string>;
}
export class LocalOnlyObjectStorage implements ObjectStorage {
  async put(): Promise<void> {
    throw new Error('Remote object storage is not configured.');
  }
  async signedReadUrl(): Promise<string> {
    throw new Error('Remote object storage is not configured.');
  }
}
