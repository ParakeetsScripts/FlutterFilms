import "server-only";

import { drmMode, isAwsMediaEnabled } from "@/lib/media/aws/config";
import { buildVodManifestUrl } from "@/lib/media/aws/cloudfront";
import { assertAuthorizedSource } from "@/lib/playback/sources";
import type { PlaybackSource } from "@/lib/playback/types";
import { getActiveLiveChannelForMovie } from "./live-repository";
import { getPublishedAssetForMovie } from "./repository";
import { buildPublicPlaybackUrl } from "./urls";

export async function buildHostedPlaybackSource(movieId: number): Promise<PlaybackSource | null> {
  const live = await getActiveLiveChannelForMovie(movieId);
  if (live?.playbackUrl) {
    return assertAuthorizedSource({
      providerId: "flutterfilms-live",
      movieId,
      type: "hls",
      url: live.playbackUrl,
      title: live.title,
      drmRequired: live.drmMode !== "none",
      isLive: true,
    });
  }

  const asset = await getPublishedAssetForMovie(movieId);
  if (!asset?.manifestRelpath) return null;

  const url = buildPublicPlaybackUrl(asset);
  if (!url) return null;

  return assertAuthorizedSource({
    providerId: "flutterfilms-vod",
    movieId,
    type: asset.playbackType,
    url,
    title: asset.title ?? "Authorized stream",
    drmRequired: asset.drmMode !== "none",
  });
}

export function describeMediaInfrastructure() {
  return {
    aws: isAwsMediaEnabled(),
    cloudfront: Boolean(process.env.AWS_CLOUDFRONT_DOMAIN?.trim()),
    mediaConvert: Boolean(process.env.AWS_MEDIACONVERT_ROLE_ARN?.trim()),
    ivs: process.env.AWS_IVS_ENABLED !== "0" && isAwsMediaEnabled(),
    drm: drmMode(),
    publicPlayback: true,
  };
}
