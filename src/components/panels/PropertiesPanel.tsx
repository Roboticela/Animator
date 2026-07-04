import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Clapperboard, Code2, Move3d, Paintbrush } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";
import { TransformInspector } from "@/components/panels/TransformInspector";
import { AnimationLibraryPanel } from "@/components/panels/AnimationLibraryPanel";
import { TexturesPanel } from "@/components/panels/TexturesPanel";
import { HtmlTo3dPanel } from "@/components/panels/HtmlTo3dPanel";

type PropertiesTab = "transform" | "textures" | "html3d" | "library";

const PROPERTIES_TABS: { id: PropertiesTab; label: string; icon: LucideIcon }[] = [
  { id: "transform", label: "Transform", icon: Move3d },
  { id: "textures", label: "Textures", icon: Paintbrush },
  { id: "html3d", label: "HTML 3D", icon: Code2 },
  { id: "library", label: "Animations", icon: Clapperboard },
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
          tab === "library" ? "overflow-hidden" : "custom-scrollbar overflow-y-auto"
        )}
      >
        {tab === "transform" && <TransformInspector embedded />}
        {tab === "textures" && <TexturesPanel embedded />}
        {tab === "html3d" && <HtmlTo3dPanel embedded />}
        {tab === "library" && <AnimationLibraryPanel embedded />}
      </div>
    </Panel>
  );
}
