import { PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION ?? "ap-south-1";
const bucket = process.env.S3_BUCKET_NAME ?? "";
function normalizeCloudFrontBase(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

const cloudfrontUrl = normalizeCloudFrontBase(process.env.CLOUDFRONT_URL ?? "");

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return client;
}

export function isS3Configured(): boolean {
  return Boolean(
    bucket &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      cloudfrontUrl
  );
}

export function buildS3Key(
  type: "missing" | "found",
  caseId: string,
  filename: string
): string {
  const ext = filename.split(".").pop() ?? "jpg";
  const uuid = crypto.randomUUID();
  return `cases/${type}/${caseId}/${uuid}.${ext}`;
}

export function getCdnUrl(s3Key: string): string {
  return `${cloudfrontUrl}/${s3Key.replace(/^\//, "")}`;
}

/** Fix URLs saved without https:// (browsers treat them as relative paths). */
export function normalizeCdnUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.includes(".cloudfront.net/") || url.startsWith("cloudfront.net")) {
    return `https://${url.replace(/^\/+/, "")}`;
  }
  return url;
}

export async function getPresignedUploadUrl(
  s3Key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    ContentType: contentType,
  });
  return getSignedUrl(getClient(), command, { expiresIn });
}

export async function deleteObject(s3Key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    })
  );
}
