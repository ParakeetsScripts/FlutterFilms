import "server-only";

import type { DrmMode } from "./config";
import { drmMode, spekeUrl } from "./config";

export type MediaConvertEncryption =
  | { Mode: "AES128" }
  | {
      Mode: "SPEKE";
      SpekeKeyProvider: {
        ResourceId: string;
        SystemIds: string[];
        Url: string;
      };
    };

const WIDEVINE_SYSTEM_ID = "9a04f079-9840-4286-ab92-e65be0885f95";
const PLAYREADY_SYSTEM_ID = "94ce86fb-07ff-4f43-adb8-93d2fa963ae8";
const FAIRPLAY_SYSTEM_ID = "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed";

export function buildMediaConvertEncryption(
  assetId: string,
  mode: DrmMode = drmMode(),
): MediaConvertEncryption | undefined {
  if (mode === "none") return undefined;

  if (mode === "aes128") {
    return { Mode: "AES128" };
  }

  const url = spekeUrl();
  if (!url) {
    throw new Error("AWS_SPEKE_URL is required for widevine_fairplay DRM mode.");
  }

  return {
    Mode: "SPEKE",
    SpekeKeyProvider: {
      ResourceId: assetId,
      SystemIds: [WIDEVINE_SYSTEM_ID, PLAYREADY_SYSTEM_ID, FAIRPLAY_SYSTEM_ID],
      Url: url,
    },
  };
}
