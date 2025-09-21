import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID as string}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY as string,
  },
});

export async function getSignedUrlForViewing(key: string) {
  return await getSignedUrl(
    S3,
    new GetObjectCommand({
      Bucket: (process.env.CLOUDFLARE_BUCKET_NAME as string) || "venturassist",
      Key: key,
    }),
    { expiresIn: 3600 },
  );
}

export async function getSignedUrlForUploading(
  key: string, // key can be uploads/userId/startupId/fileName-timestamp.extension
  contentType: string,
  contentLength: number,
) {
  return await getSignedUrl(
    S3,
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME as string,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    { expiresIn: 360 },
  );
}
