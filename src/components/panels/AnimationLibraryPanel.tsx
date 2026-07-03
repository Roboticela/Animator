import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Box, Copy, Film, Layers, PenTool, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAnimationStore } from "@/store/animationStore";
import { useModelStore } from "@/store/modelStore";
import { createNewCustomClip, duplicateClipAsCustom, duplicateCustomClip } from "@/lib/app-actions";
import type { ClipMeta } from "@/types/model";

type AnimationTab = "embedded" | "custom";

const ANIMATION_TABS: { id: AnimationTab; label: string; icon: LucideIcon }[] = [
  { id: "embedded", label: "Embedded", icon: Layers },
  { id: "custom", label: "Custom", icon: PenTool },
];

function AnimationTabBar({
  tab,
  onTabChange,
  embeddedCount,
  customCount,
}: {
  tab: AnimationTab;
  onTabChange: (tab: AnimationTab) => void;
  embeddedCount: number;
  customCount: number;
}) {
  const counts: Record<AnimationTab, number> = { embedded: embeddedCount, custom: customCount };

  return (
    <div className="flex flex-shrink-0 border-b border-border/50 px-2 py-2">
      <div className="flex w-full gap-0.5 rounded-lg border border-border/50 bg-background-subtle p-0.5">
        {ANIMATION_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors",
              tab === id ? "bg-card text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", tab === id ? "text-primary" : "text-foreground/50")} />
            {label}
            <span
              className={cn(
                "rounded px-1 py-0.5 font-mono text-[9px]",
                tab === id ? "bg-primary/10 text-primary" : "bg-background text-foreground-muted"
              )}
            >
              {counts[id]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-background-subtle/40 px-4 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-foreground-muted">{description}</p>
      </div>
    </div>
  );
}

function ClipCard({
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
  onRename: (name: string) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(clip.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(clip.name);
  }, [clip.name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitRename = () => {
    const next = draft.trim();
    if (next && next !== clip.name) onRename(next);
    else setDraft(clip.name);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "group rounded-xl border transition-colors",
        isActive ? "border-primary/40 bg-primary/8 shadow-sm" : "border-border/60 bg-card hover:border-border hover:bg-accent/20"
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onClick={onSelect}
          title="Play clip"
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border transition-colors",
            isActive
              ? "border-primary/30 bg-primary/15 text-primary"
              : "border-border/60 bg-background-subtle text-foreground-muted hover:border-primary/25 hover:text-primary"
          )}
        >
          <Play className="h-3.5 w-3.5" />
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraft(clip.name);
                  setEditing(false);
                }
              }}
              className="h-7 w-full rounded-md border border-primary/40 bg-background px-2 text-xs font-medium text-foreground outline-none ring-1 ring-primary/20"
              aria-label="Animation name"
            />
          ) : (
            <button
              type="button"
              onClick={onSelect}
              onDoubleClick={() => setEditing(true)}
              title="Double-click to rename"
              className="block w-full truncate text-left text-xs font-semibold text-foreground"
            >
              {clip.name}
            </button>
          )}
          <p className="mt-0.5 text-[10px] text-foreground-muted">{clip.duration.toFixed(2)}s</p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Rename"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          {onDuplicate && (
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplicate" onClick={onDuplicate}>
              <Copy className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" title="Delete" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function NewClipForm({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState("");

  const handleCreate = () => {
    onCreate(name.trim() || "New Clip");
    setName("");
  };

  return (
    <div className="mb-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-2.5">
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
        New animation
      </label>
      <div className="flex gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
          placeholder="Animation name"
          className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background-subtle px-2.5 text-xs text-foreground placeholder:text-foreground-muted focus:border-primary/50 focus:outline-none"
        />
        <Button type="button" size="sm" className="h-8 flex-shrink-0 gap-1.5 px-2.5" onClick={handleCreate}>
          <Plus className="h-3.5 w-3.5" />
          Create
        </Button>
      </div>
    </div>
  );
}

export function AnimationLibraryPanel({ embedded: embeddedInPanel }: { embedded?: boolean } = {}) {
  const model = useModelStore((s) => s.model);
  const clips = useAnimationStore((s) => s.clips);
  const activeClipId = useAnimationStore((s) => s.activeClipId);
  const setActiveClipId = useAnimationStore((s) => s.setActiveClipId);
  const play = useAnimationStore((s) => s.play);
  const removeClip = useAnimationStore((s) => s.removeClip);
  const renameClip = useAnimationStore((s) => s.renameClip);
  const [tab, setTab] = useState<AnimationTab>("embedded");

  if (!model) return null;

  const embedded = clips.filter((c) => c.source === "embedded");
  const custom = clips.filter((c) => c.source === "custom");

  const activate = (id: string) => {
    setActiveClipId(id);
    play();
  };

  const libraryBody = (
    <div className="flex h-full min-h-0 flex-col">
      <AnimationTabBar
        tab={tab}
        onTabChange={setTab}
        embeddedCount={embedded.length}
        customCount={custom.length}
      />

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
        {tab === "embedded" && (
          <div className="space-y-2">
            {embedded.length === 0 ? (
              <EmptyState
                icon={Box}
                title="No embedded animations"
                description="This file didn't include baked-in clips. Switch to Custom to author your own animations."
              />
            ) : (
              embedded.map((clip) => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  isActive={clip.id === activeClipId}
                  onSelect={() => activate(clip.id)}
                  onRename={(name) => renameClip(clip.id, name)}
                  onDuplicate={() => duplicateClipAsCustom(clip)}
                />
              ))
            )}
          </div>
        )}

        {tab === "custom" && (
          <div className="space-y-2">
            <NewClipForm onCreate={(name) => createNewCustomClip(name)} />
            {custom.length === 0 ? (
              <EmptyState
                icon={PenTool}
                title="No custom animations yet"
                description='Name a clip above, then pose bones with the gizmo and click "Set Keyframe" in Transform.'
              />
            ) : (
              custom.map((clip) => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  isActive={clip.id === activeClipId}
                  onSelect={() => activate(clip.id)}
                  onRename={(name) => renameClip(clip.id, name)}
                  onDuplicate={() => duplicateCustomClip(clip)}
                  onDelete={() => removeClip(clip.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (embeddedInPanel) return <div className="h-full min-h-0 overflow-hidden">{libraryBody}</div>;

  return (
    <Panel title="Animations" icon={<Film className="h-3.5 w-3.5" />} noPadding bodyClassName="overflow-hidden">
      {libraryBody}
    </Panel>
  );
}
