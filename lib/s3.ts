import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT_URL || "https://t3.storageapi.dev",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.AWS_S3_BUCKET_NAME || "preserved-eclair-3di75lbk";

export async function listRunFiles(runId: string): Promise<{ key: string; size: number }[]> {
  try {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `seedance/${runId}/`,
    }));
    return (res.Contents || []).map(f => ({
      key: f.Key || "",
      size: f.Size || 0,
    }));
  } catch {
    return [];
  }
}

export async function getFileBuffer(key: string): Promise<Buffer | null> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

export async function listAllRunIds(): Promise<string[]> {
  try {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "seedance/",
      Delimiter: "/",
    }));
    return (res.CommonPrefixes || [])
      .map(p => (p.Prefix || "").replace("seedance/", "").replace("/", ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}
