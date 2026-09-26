import type { InstallPlatform } from "./install-prompt";
import { detectInstallPlatform, isStandalonePwa } from "./install-prompt";

export type InstallMethod = "automatic" | "manual" | "unavailable";

export type InstallCapability = {
  platform: InstallPlatform;
  standalone: boolean;
  method: InstallMethod;
  browserLabel: string;
  summary: string;
};

export function detectBrowserLabel(): string {
  if (typeof navigator === "undefined") return "your browser";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Google Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  return "your browser";
}

export function installMethodForPlatform(platform: InstallPlatform, hasDeferredPrompt: boolean): InstallMethod {
  if (hasDeferredPrompt) return "automatic";
  if (platform === "ios" || platform === "ipad") return "manual";
  if (platform === "android") return "manual";
  if (platform === "windows" || platform === "mac" || platform === "linux") return "manual";
  return "unavailable";
}

export function installSummary(capability: InstallCapability): string {
  if (capability.standalone) {
    return `${capability.browserLabel} is already running FlutterFilms in installed mode.`;
  }
  if (capability.method === "automatic") {
    return "Your browser supports one-tap installation for FlutterFilms.";
  }
  if (capability.method === "manual") {
    return "Use the manual steps below — browser menus vary by device and version.";
  }
  return "Installation may not be available here. FlutterFilms remains fully usable in the browser.";
}

export function getInstallCapability(hasDeferredPrompt = false): InstallCapability {
  const platform = detectInstallPlatform();
  const standalone = isStandalonePwa();
  const method = standalone ? "unavailable" : installMethodForPlatform(platform, hasDeferredPrompt);
  const browserLabel = detectBrowserLabel();
  const capability: InstallCapability = { platform, standalone, method, browserLabel, summary: "" };
  capability.summary = installSummary(capability);
  return capability;
}

export function uninstallInstructionsFor(platform: InstallPlatform): string[] {
  switch (platform) {
    case "ios":
    case "ipad":
      return ["Long-press the FlutterFilms home screen icon.", "Tap Remove App or Delete Bookmark.", "Confirm removal."];
    case "android":
      return ["Open your launcher or Settings → Apps.", "Find FlutterFilms.", "Uninstall or Remove."];
    case "mac":
      return ["In Chrome or Edge, open installed site settings and remove.", "In Safari, remove from Dock or delete the shortcut."];
    case "windows":
      return ["Open installed apps in Windows.", "Right-click FlutterFilms.", "Uninstall."];
    default:
      return ["Remove the installed web app from your browser or launcher like any other shortcut."];
  }
}
