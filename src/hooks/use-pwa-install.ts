"use client";

import {
  getDeferredInstallPrompt,
  isStandalonePwa,
  needsManualInstallGuide,
  triggerInstallPrompt,
} from "@/lib/pwa/install-prompt";
import { useCallback, useEffect, useState } from "react";

export function usePwaInstall() {
  const [standalone, setStandalone] = useState(false);
  const [installReady, setInstallReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setStandalone(isStandalonePwa());
      setInstallReady(Boolean(getDeferredInstallPrompt()));
    };
    sync();
    window.addEventListener("ff-install-prompt-ready", sync);
    window.addEventListener("ff-pwa-installed", sync);
    return () => {
      window.removeEventListener("ff-install-prompt-ready", sync);
      window.removeEventListener("ff-pwa-installed", sync);
    };
  }, []);

  const canInstall = installReady && !standalone;
  const showManualHint = needsManualInstallGuide() && !standalone && !installReady;

  const install = useCallback(async () => {
    if (!installReady) return false;
    const outcome = await triggerInstallPrompt();
    if (outcome === "accepted") {
      setInstallReady(false);
      setStandalone(isStandalonePwa());
      return true;
    }
    return false;
  }, [installReady]);

  return { canInstall, showManualHint, standalone, install, installReady };
}
