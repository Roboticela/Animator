import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Film, Move3d } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";
import { TransformInspector } from "@/components/panels/TransformInspector";
import { AnimationLibraryPanel } from "@/components/panels/AnimationLibraryPanel";

type PropertiesTab = "transform" | "library";

const PROPERTIES_TABS: { id: PropertiesTab; label: string; icon: LucideIcon }[] = [
  { id: "transform", label: "Transform", icon: Move3d },
  { id: "library", label: "Animations", icon: Film },
];

export function PropertiesPanel() {
  const [tab, setTab] = useState<PropertiesTab>("transform");

  return (
    <Panel
      title="Properties"
      icon={<Move3d className="h-3.5 w-3.5" />}
      noPadding
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
    >
      <div className="flex flex-shrink-0 border-b border-border/50 px-2 py-2">
        <div className="flex w-full gap-0.5 rounded-lg border border-border/50 bg-background-subtle p-0.5">
          {PROPERTIES_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors",
                tab === id ? "bg-card text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", tab === id ? "text-primary" : "text-foreground/50")} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden",
          tab === "transform" ? "custom-scrollbar overflow-y-auto" : "overflow-hidden"
        )}
      >
        {tab === "transform" ? <TransformInspector embedded /> : <AnimationLibraryPanel embedded />}
      </div>
    </Panel>
  );
}
