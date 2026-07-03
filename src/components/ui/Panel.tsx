import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

export function Panel({ title, icon, actions, children, className, bodyClassName, noPadding }: PanelProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card", className)}>
      {title && (
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
            {icon}
            <span className="truncate">{title}</span>
          </div>
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
      )}
      <div className={cn("custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden", !noPadding && "p-3 sm:p-4", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}
