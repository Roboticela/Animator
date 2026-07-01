import { Loader2 } from "lucide-react";
import { useModelStore } from "@/store/modelStore";

/** Non-blocking loading indicator below the header — header/menu stay interactive. */
export function LoadingOverlay() {
  const isLoading = useModelStore((s) => s.isLoading);
  const message = useModelStore((s) => s.loadingMessage);

  if (!isLoading) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 top-14 z-30 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/95 px-8 py-6 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-foreground/60">{message ?? "Loading…"}</p>
      </div>
    </div>
  );
}
