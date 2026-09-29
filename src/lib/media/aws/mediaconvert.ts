import "server-only";

import {
  CreateJobCommand,
  GetJobCommand,
  MediaConvertClient,
  type JobStatus,
} from "@aws-sdk/client-mediaconvert";
import { buildMediaConvertEncryption } from "./drm";
import {
  awsRegion,
  awsS3Bucket,
  drmMode,
  mediaConvertEndpoint,
  mediaConvertQueueArn,
  mediaConvertRoleArn,
  s3Uri,
  vodOutputPrefix,
} from "./config";

let client: MediaConvertClient | null = null;

function getMediaConvert(): MediaConvertClient {
  if (!client) {
    const endpoint = mediaConvertEndpoint();
    client = new MediaConvertClient({
      region: awsRegion(),
      ...(endpoint ? { endpoint } : {}),
    });
  }
  return client;
}

export async function submitVodTranscodeJob(input: {
  assetId: string;
  sourceKey: string;
}): Promise<string> {
  const roleArn = mediaConvertRoleArn();
  if (!roleArn) {
    throw new Error("AWS_MEDIACONVERT_ROLE_ARN is not configured.");
  }

  const outputPrefix = vodOutputPrefix(input.assetId);
  const destination = s3Uri(`${outputPrefix}/`);
  const encryption = buildMediaConvertEncryption(input.assetId, drmMode());
  const hlsEncryption =
    encryption?.Mode === "AES128"
      ? { EncryptionMethod: "AES128" as const, InitializationVectorInManifest: "INCLUDE" as const }
      : undefined;

  const command = new CreateJobCommand({
    Role: roleArn,
    ...(mediaConvertQueueArn() ? { Queue: mediaConvertQueueArn()! } : {}),
    Settings: {
      Inputs: [
        {
          FileInput: s3Uri(input.sourceKey),
          AudioSelectors: { "Audio Selector 1": { DefaultSelection: "DEFAULT" } },
          VideoSelector: {},
        },
      ],
      OutputGroups: [
        {
          Name: "HLS Group",
          OutputGroupSettings: {
            Type: "HLS_GROUP_SETTINGS",
            HlsGroupSettings: {
              Destination: destination,
              SegmentLength: 6,
              MinSegmentLength: 0,
              DirectoryStructure: "SINGLE_DIRECTORY",
              ManifestDurationFormat: "INTEGER",
              StreamInfResolution: "INCLUDE",
              ...(hlsEncryption ? { Encryption: hlsEncryption } : {}),
            },
          },
          Outputs: [
            {
              NameModifier: "_360p",
              VideoDescription: {
                Width: 640,
                Height: 360,
                CodecSettings: {
                  Codec: "H_264",
                  H264Settings: {
                    RateControlMode: "QVBR",
                    QvbrSettings: { QvbrQualityLevel: 7 },
                    MaxBitrate: 800000,
                  },
                },
              },
              AudioDescriptions: [
                {
                  AudioSourceName: "Audio Selector 1",
                  CodecSettings: { Codec: "AAC", AacSettings: { Bitrate: 96000, CodingMode: "CODING_MODE_2_0" } },
                },
              ],
              ContainerSettings: { Container: "M3U8" },
            },
            {
              NameModifier: "_720p",
              VideoDescription: {
                Width: 1280,
                Height: 720,
                CodecSettings: {
                  Codec: "H_264",
                  H264Settings: {
                    RateControlMode: "QVBR",
                    QvbrSettings: { QvbrQualityLevel: 8 },
                    MaxBitrate: 3000000,
                  },
                },
              },
              AudioDescriptions: [
                {
                  AudioSourceName: "Audio Selector 1",
                  CodecSettings: { Codec: "AAC", AacSettings: { Bitrate: 128000, CodingMode: "CODING_MODE_2_0" } },
                },
              ],
              ContainerSettings: { Container: "M3U8" },
            },
            {
              NameModifier: "_1080p",
              VideoDescription: {
                Width: 1920,
                Height: 1080,
                CodecSettings: {
                  Codec: "H_264",
                  H264Settings: {
                    RateControlMode: "QVBR",
                    QvbrSettings: { QvbrQualityLevel: 9 },
                    MaxBitrate: 6000000,
                  },
                },
              },
              AudioDescriptions: [
                {
                  AudioSourceName: "Audio Selector 1",
                  CodecSettings: { Codec: "AAC", AacSettings: { Bitrate: 160000, CodingMode: "CODING_MODE_2_0" } },
                },
              ],
              ContainerSettings: { Container: "M3U8" },
            },
          ],
        },
      ],
    },
  });

  const response = await getMediaConvert().send(command);
  if (!response.Job?.Id) throw new Error("MediaConvert did not return a job ID.");
  return response.Job.Id;
}

export async function getMediaConvertJob(jobId: string): Promise<{
  status: JobStatus;
  progress: number;
  errorMessage: string | null;
}> {
  const response = await getMediaConvert().send(new GetJobCommand({ Id: jobId }));
  const job = response.Job;
  const status = job?.Status ?? "ERROR";
  const progress = job?.JobPercentComplete ?? (status === "COMPLETE" ? 100 : 0);
  return {
    status,
    progress,
    errorMessage: job?.ErrorMessage ?? null,
  };
}

export function defaultManifestKey(assetId: string): string {
  return `${vodOutputPrefix(assetId)}/master.m3u8`;
}

export function outputBucketName(): string {
  return awsS3Bucket();
}
