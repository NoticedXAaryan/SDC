import "server-only";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";
import { normalizeStorageKey } from "@/lib/services/storage-key";

export interface StorageService {
  uploadFile(buffer: Uint8Array | Buffer, filePath: string, mimeType: string): Promise<string>;
  deleteFile(url: string): Promise<void>;
}

export class LocalStorageService implements StorageService {
  private readonly root = path.resolve(process.cwd(), "public", "uploads");

  async uploadFile(buffer: Uint8Array | Buffer, filePath: string): Promise<string> {
    const key = normalizeStorageKey(filePath);
    const fullPath = path.resolve(this.root, ...key.split("/"));

    if (!fullPath.startsWith(`${this.root}${path.sep}`)) throw new Error("Invalid storage path");

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return `/uploads/${key}`;
  }

  async deleteFile(url: string): Promise<void> {
    if (!url.startsWith("/uploads/")) return;

    const key = normalizeStorageKey(url.slice("/uploads/".length));
    const fullPath = path.resolve(this.root, ...key.split("/"));
    if (!fullPath.startsWith(`${this.root}${path.sep}`)) return;

    await fs.rm(fullPath, { force: true });
  }
}

class S3StorageService implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    if (!env.S3_BUCKET || !env.S3_PUBLIC_URL || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      throw new Error("S3 storage requires S3_BUCKET, S3_PUBLIC_URL, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY");
    }

    this.bucket = env.S3_BUCKET;
    this.publicUrl = env.S3_PUBLIC_URL.replace(/\/$/, "");
    this.client = new S3Client({
      region: env.S3_REGION || "auto",
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(buffer: Uint8Array | Buffer, filePath: string, mimeType: string): Promise<string> {
    const key = normalizeStorageKey(filePath);
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));

    return `${this.publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  async deleteFile(url: string): Promise<void> {
    if (!url.startsWith(`${this.publicUrl}/`)) return;
    const key = normalizeStorageKey(decodeURIComponent(url.slice(this.publicUrl.length + 1)));
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

let storageService: StorageService | undefined;

export function getStorageService(): StorageService {
  storageService ??= env.STORAGE_DRIVER === "s3"
    ? new S3StorageService()
    : new LocalStorageService();
  return storageService;
}
