import type { InstallPlatform } from "./install-prompt";
import {
  detectInstallPlatform,
  isIosSafari,
  isSafariBrowser,
  isStandalonePwa,
} from "./install-prompt";

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
    if (isIosSafari()) {
      return "Tap Share, then choose Add to Home Screen in Safari.";
    }
    if (capability.platform === "mac" && isSafariBrowser()) {
      return "In Safari, use File → Add to Dock or Share → Add to Dock.";
    }
    return "Follow the steps below for your browser — menus vary by device and version.";
  }
  return "Installation may not be available here. FlutterFilms remains fully usable in the browser.";
}

export function manualInstallStepsFor(
  platform: InstallPlatform,
  browserLabel: string,
  siteLabel: string,
  siteUrl: string,
): string[] {
  if (platform === "ios" || platform === "ipad") {
    return [
      `Open FlutterFilms in Safari at ${siteLabel}.`,
      "Tap the Share button at the bottom of the screen.",
      'Choose "Add to Home Screen".',
      "Confirm the name FlutterFilms, then tap Add.",
    ];
  }
  if (platform === "mac" && isSafariBrowser()) {
    return [
      `Make sure you are on ${siteUrl} in Safari.`,
      "Open the File menu and choose Add to Dock (Safari 17+), or click Share and choose Add to Dock.",
      "Confirm the name FlutterFilms.",
      "Launch FlutterFilms from your Dock like any other app.",
    ];
  }
  if (platform === "mac") {
    return [
      `Open FlutterFilms in Chrome or Edge at ${siteUrl}.`,
      "Click the install icon in the address bar, or open the browser menu.",
      "Choose Install FlutterFilms and confirm.",
    ];
  }
  if (platform === "android") {
    return [
      `Open FlutterFilms in Chrome at ${siteLabel}.`,
      "Open the browser menu (⋮).",
      'Choose "Install app" or "Add to Home screen".',
      "Confirm installation.",
    ];
  }
  if (platform === "windows") {
    return [
      `Open FlutterFilms in Chrome or Edge at ${siteUrl}.`,
      "Click the install icon in the address bar, or open the browser menu.",
      "Choose Install FlutterFilms and confirm.",
    ];
  }
  if (platform === "linux") {
    return [
      `Open FlutterFilms in Chrome at ${siteUrl}.`,
      "Look for Install in the address bar or browser menu.",
      "If no install control appears, bookmark the site or pin the tab.",
    ];
  }
  return [
    `Open FlutterFilms at ${siteUrl}.`,
    `Use ${browserLabel} menus to add the site to your home screen, dock, or launcher.`,
  ];
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
