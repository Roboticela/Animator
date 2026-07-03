import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CardPreviewLoader({
  label = "Loading preview…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-background-subtle",
        className
      )}
    >
      <Loader2 className="h-7 w-7 animate-spin text-primary/70" aria-hidden />
      <span className="text-[10px] text-foreground-muted">{label}</span>
    </div>
  );
}
