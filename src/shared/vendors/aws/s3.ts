import {
  S3Client,
  HeadObjectCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

/**
 * Create an S3 client using environment variables.
 */
export function createS3Client(): S3Client {
  return new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Check if an object exists in S3.
 */
export async function objectExists(
  client: S3Client,
  bucket: string,
  key: string
): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err: any) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

/**
 * List all existing keys under a prefix using ListObjectsV2 (batch-efficient).
 * Returns a Set of full keys.
 */
export async function listExistingKeys(
  client: S3Client,
  bucket: string,
  prefix: string
): Promise<Set<string>> {
  const keys = new Set<string>();
  let continuationToken: string | undefined;

  do {
    const response: ListObjectsV2CommandOutput = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) keys.add(obj.Key);
      }
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return keys;
}

/**
 * Stream an image directly from a source URL to S3 (no local disk).
 */
export async function streamUrlToS3(
  client: S3Client,
  sourceUrl: string,
  bucket: string,
  key: string
): Promise<void> {
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${sourceUrl}: ${response.status} ${response.statusText}`
    );
  }

  if (!response.body) {
    throw new Error(`No response body for ${sourceUrl}`);
  }

  // Convert web ReadableStream to Node Readable
  const nodeStream = Readable.fromWeb(response.body as any);

  const contentType =
    response.headers.get("content-type") || "image/jpeg";

  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: nodeStream,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000", // 1 year — thumbnails are immutable
    },
  });

  await upload.done();
}

/**
 * Derive the deterministic S3 key for a thumbnail.
 */
export function getThumbnailS3Key(
  platform: string,
  mediaId: string
): string {
  return `thumbnails/${platform}/${mediaId}.jpg`;
}

/**
 * Derive the public URL for a self-hosted thumbnail.
 * Returns null if S3 is not configured.
 */
export function getThumbnailPublicUrl(
  platform: string,
  mediaId: string
): string | null {
  const baseUrl = process.env.S3_PUBLIC_URL;
  if (!baseUrl) return null;
  return `${baseUrl}/thumbnails/${platform}/${mediaId}.jpg`;
}
