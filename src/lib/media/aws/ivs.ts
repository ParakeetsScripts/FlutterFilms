import "server-only";

import {
  CreateChannelCommand,
  GetChannelCommand,
  IvsClient,
  type Channel,
} from "@aws-sdk/client-ivs";
import { awsRegion, isIvsEnabled } from "./config";

let client: IvsClient | null = null;

function getIvs(): IvsClient {
  if (!client) {
    client = new IvsClient({ region: awsRegion() });
  }
  return client;
}

export function ivsReady(): boolean {
  return isIvsEnabled();
}

export async function createLiveChannel(input: {
  name: string;
  authorized?: boolean;
}): Promise<{
  channelArn: string;
  ingestEndpoint: string;
  streamKey: string;
  playbackUrl: string;
}> {
  if (!ivsReady()) {
    throw new Error("Amazon IVS is not enabled. Set AWS_IVS_ENABLED=1 and configure AWS credentials.");
  }

  const response = await getIvs().send(
    new CreateChannelCommand({
      name: input.name.slice(0, 128),
      type: "STANDARD",
      latencyMode: "LOW",
      authorized: input.authorized ?? false,
    }),
  );

  const channel = response.channel;
  const streamKey = response.streamKey?.value;
  if (!channel?.arn || !channel.ingestEndpoint || !streamKey || !channel.playbackUrl) {
    throw new Error("IVS channel creation returned incomplete data.");
  }

  return {
    channelArn: channel.arn,
    ingestEndpoint: channel.ingestEndpoint,
    streamKey,
    playbackUrl: channel.playbackUrl,
  };
}

export async function getLiveChannel(channelArn: string): Promise<Channel | null> {
  const response = await getIvs().send(new GetChannelCommand({ arn: channelArn }));
  return response.channel ?? null;
}

export function rtmpIngestUrl(ingestEndpoint: string): string {
  return `rtmps://${ingestEndpoint}:443/app/`;
}
