export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function captureInstallPrompt(event: Event) {
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
}

export function getDeferredInstallPrompt() {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null;
}

export async function triggerInstallPrompt(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const prompt = deferredPrompt;
  if (!prompt) return "unavailable";
  await prompt.prompt();
  const choice = await prompt.userChoice;
  clearDeferredInstallPrompt();
  return choice.outcome;
}

export type InstallPlatform = "ios" | "ipad" | "android" | "mac" | "windows" | "linux" | "unknown";

export function detectInstallPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const platform = navigator.platform ?? "";

  if (/iPad/.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ipad";
  if (/iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Mac/i.test(platform)) return "mac";
  if (/Win/i.test(platform)) return "windows";
  if (/Linux/i.test(platform)) return "linux";
  return "unknown";
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isSafariBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Edg\//.test(ua);
}

export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const platform = detectInstallPlatform();
  return (platform === "ios" || platform === "ipad") && isSafariBrowser();
}

/** Browsers that require Share / Add to Dock / Add to Home Screen instead of beforeinstallprompt. */
export function needsManualInstallGuide(): boolean {
  if (isStandalonePwa()) return false;
  const platform = detectInstallPlatform();
  if (platform === "ios" || platform === "ipad") return true;
  if (platform === "mac" && isSafariBrowser()) return true;
  return false;
}
