import "server-only";

import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { awsRegion, awsS3Bucket } from "./config";

let client: S3Client | null = null;

function getS3(): S3Client {
  if (!client) {
    client = new S3Client({ region: awsRegion() });
  }
  return client;
}

export async function createMultipartUpload(key: string, contentType = "video/mp4"): Promise<string> {
  const response = await getS3().send(
    new CreateMultipartUploadCommand({
      Bucket: awsS3Bucket(),
      Key: key,
      ContentType: contentType,
    }),
  );
  if (!response.UploadId) throw new Error("S3 did not return an upload ID.");
  return response.UploadId;
}

export async function presignUploadPart(input: {
  key: string;
  uploadId: string;
  partNumber: number;
  expiresIn?: number;
}): Promise<string> {
  return getSignedUrl(
    getS3(),
    new UploadPartCommand({
      Bucket: awsS3Bucket(),
      Key: input.key,
      UploadId: input.uploadId,
      PartNumber: input.partNumber,
    }),
    { expiresIn: input.expiresIn ?? 3600 },
  );
}

export async function completeMultipartUpload(input: {
  key: string;
  uploadId: string;
  parts: { partNumber: number; etag: string }[];
}): Promise<void> {
  await getS3().send(
    new CompleteMultipartUploadCommand({
      Bucket: awsS3Bucket(),
      Key: input.key,
      UploadId: input.uploadId,
      MultipartUpload: {
        Parts: input.parts
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((part) => ({
            ETag: part.etag,
            PartNumber: part.partNumber,
          })),
      },
    }),
  );
}

export async function putObjectBuffer(key: string, body: Buffer, contentType = "application/octet-stream"): Promise<void> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: awsS3Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}
