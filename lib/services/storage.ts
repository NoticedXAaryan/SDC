export interface IStorageService {
  uploadFile(buffer: Uint8Array, filename: string, mimeType: string): Promise<string>;
}

export class LocalMockStorageService implements IStorageService {
  async uploadFile(buffer: Uint8Array, filename: string, mimeType: string): Promise<string> {
    // In a real app, upload to S3/Cloudflare R2 here
    console.log(`[Storage] Uploaded ${filename} (${buffer.length} bytes) as ${mimeType}`);
    // Mock URL for now
    return `https://storage.stc.local/${filename}`;
  }
}
