import { useState } from "react";
import {
  ArrowUpCircle,
  Copy,
  Film,
  Footprints,
  Hand,
  Music,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import { useAnimationStore } from "@/store/animationStore";
import { useModelStore } from "@/store/modelStore";
import { PROCEDURAL_ANIMATIONS, countMatchedRoles, type ProceduralAnimationId } from "@/lib/procedural-animations";
import { applyPremadeAnimation, createNewCustomClip, duplicateClipAsCustom, duplicateCustomClip } from "@/lib/app-actions";
import type { ClipMeta } from "@/types/model";

const PREMADE_ICONS: Record<ProceduralAnimationId, typeof Play> = {
  idle: Sparkles,
  walk: Footprints,
  run: Zap,
  wave: Hand,
  jump: ArrowUpCircle,
  spin: RotateCw,
  dance: Music,
};

const TOTAL_ROLE_COUNT = 18;

function ClipRow({
  clip,
  isActive,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
}: {
  clip: ClipMeta;
  isActive: boolean;
  onSelect: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition-colors",
        isActive ? "border-primary/40 bg-primary/10" : "border-transparent hover:bg-accent"
      )}
    >
      <button onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <Play className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-primary" : "text-foreground-muted")} />
        <span className={cn("truncate font-medium", isActive ? "text-primary" : "text-foreground")}>{clip.name}</span>
        <span className="ml-auto flex-shrink-0 font-mono text-[10px] text-foreground-muted">{clip.duration.toFixed(1)}s</span>
      </button>
      <div className="flex flex-shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
        {onRename && (
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Rename" onClick={onRename}>
            <Pencil className="h-3 w-3" />
          </Button>
        )}
        {onDuplicate && (
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Duplicate as custom clip" onClick={onDuplicate}>
            <Copy className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-danger" title="Delete" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function AnimationLibraryPanel() {
  const model = useModelStore((s) => s.model);
  const boneMap = useModelStore((s) => s.boneMap);
  const clips = useAnimationStore((s) => s.clips);
  const activeClipId = useAnimationStore((s) => s.activeClipId);
  const setActiveClipId = useAnimationStore((s) => s.setActiveClipId);
  const play = useAnimationStore((s) => s.play);
  const removeClip = useAnimationStore((s) => s.removeClip);
  const renameClip = useAnimationStore((s) => s.renameClip);
  const [tab, setTab] = useState("premade");

  if (!model) return null;

  const embedded = clips.filter((c) => c.source === "embedded");
  const premade = clips.filter((c) => c.source === "premade");
  const custom = clips.filter((c) => c.source === "custom");

  const bones = Array.from(boneMap.values());
  const matchedRoles = bones.length > 0 ? countMatchedRoles(bones) : 0;
  const coveragePct = Math.round((matchedRoles / TOTAL_ROLE_COUNT) * 100);

  const activate = (id: string) => {
    setActiveClipId(id);
    play();
  };

  const rename = (clip: ClipMeta) => {
    const next = window.prompt("Rename clip", clip.name);
    if (next && next.trim()) renameClip(clip.id, next.trim());
  };

  return (
    <Panel title="Animation Library" icon={<Film className="h-3.5 w-3.5" />} noPadding bodyClassName="overflow-hidden">
      <Tabs value={tab} onValueChange={setTab} className="flex h-full min-h-0 flex-col">
        <TabsList>
          <TabsTrigger value="embedded">Embedded ({embedded.length})</TabsTrigger>
          <TabsTrigger value="premade">Premade</TabsTrigger>
          <TabsTrigger value="custom">Custom ({custom.length})</TabsTrigger>
        </TabsList>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
          <TabsContent value="embedded" className="space-y-1">
            {embedded.length === 0 && (
              <p className="p-2 text-xs leading-relaxed text-foreground-muted">
                This file didn't include any baked-in animations. Try the Premade tab instead.
              </p>
            )}
            {embedded.map((clip) => (
              <ClipRow
                key={clip.id}
                clip={clip}
                isActive={clip.id === activeClipId}
                onSelect={() => activate(clip.id)}
                onDuplicate={() => duplicateClipAsCustom(clip)}
              />
            ))}
          </TabsContent>

          <TabsContent value="premade" className="space-y-2">
            {bones.length === 0 ? (
              <p className="p-2 text-xs leading-relaxed text-foreground-muted">
                No bones detected — premade animations need a rigged (skinned) model.
              </p>
            ) : (
              <div className="mb-1 flex items-center justify-between rounded-lg border border-border/60 bg-background-subtle px-2 py-1.5 text-[11px] text-foreground-muted">
                <span>Rig compatibility</span>
                <span className="font-mono font-semibold text-foreground">{coveragePct}%</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              {PROCEDURAL_ANIMATIONS.map((def) => {
                const Icon = PREMADE_ICONS[def.id];
                const meta = premade.find((c) => c.id === `premade-${def.id}`);
                const isActive = meta?.id === activeClipId;
                return (
                  <button
                    key={def.id}
                    disabled={bones.length === 0}
                    onClick={() => {
                      const ok = applyPremadeAnimation(def.id);
                      if (ok) play();
                    }}
                    title={def.description}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      isActive ? "border-primary/50 bg-primary/10" : "border-border hover:bg-accent"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-foreground-muted")} />
                    <span className={cn("text-xs font-semibold", isActive ? "text-primary" : "text-foreground")}>{def.name}</span>
                  </button>
                );
              })}
            </div>
            {premade.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-border/60 pt-2">
                <div className="px-1 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">Previewed</div>
                {premade.map((clip) => (
                  <ClipRow
                    key={clip.id}
                    clip={clip}
                    isActive={clip.id === activeClipId}
                    onSelect={() => activate(clip.id)}
                    onDuplicate={() => duplicateClipAsCustom(clip)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-1">
            <Button variant="outline" size="sm" className="mb-1.5 w-full" onClick={() => createNewCustomClip()}>
              <Plus className="h-3.5 w-3.5" />
              New Clip
            </Button>
            {custom.length === 0 && (
              <p className="p-2 text-xs leading-relaxed text-foreground-muted">
                Create a clip, then pose bones with the gizmo and click "Set Keyframe" in the Transform panel.
              </p>
            )}
            {custom.map((clip) => (
              <ClipRow
                key={clip.id}
                clip={clip}
                isActive={clip.id === activeClipId}
                onSelect={() => activate(clip.id)}
                onRename={() => rename(clip)}
                onDuplicate={() => duplicateCustomClip(clip)}
                onDelete={() => removeClip(clip.id)}
              />
            ))}
          </TabsContent>
        </div>
      </Tabs>
    </Panel>
  );
}
