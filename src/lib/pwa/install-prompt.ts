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
