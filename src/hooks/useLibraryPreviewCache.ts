import { useEffect, useState } from "react";
import { clearLibraryPreviewCache, warmLibraryPreviewCache } from "@/lib/library-preview-cache";
import { resetDefaultPreviewSource } from "@/lib/animation-preview";
import { resetPreviewSlots } from "@/hooks/usePreviewSlot";

export type LibraryCacheStatus = "idle" | "warming" | "ready" | "error";

/** Warms the sample-rig preview cache when the library opens. */
export function useLibraryPreviewCache(isOpen: boolean): LibraryCacheStatus {
  const [status, setStatus] = useState<LibraryCacheStatus>("idle");

  useEffect(() => {
    if (!isOpen) {
      setStatus("idle");
      return;
    }

    resetDefaultPreviewSource();
    let cancelled = false;
    setStatus("warming");

    warmLibraryPreviewCache()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      clearLibraryPreviewCache();
      resetPreviewSlots();
      setStatus("idle");
    };
  }, [isOpen]);

  return status;
}
