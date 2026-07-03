import { useEffect, useMemo, useRef, useState } from "react";
import { Library, Plus, Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AnimationPreviewCanvas } from "@/components/animation/AnimationPreviewCanvas";
import { addLibraryAnimationAsCustom } from "@/lib/app-actions";
import { canPreviewLibraryAnimation, getDefaultPreviewBones, resetDefaultPreviewSource } from "@/lib/animation-preview";
import { getAnimationIcon, getCategoryIcon } from "@/lib/animation-icons";
import {
  PROCEDURAL_ANIMATIONS,
  PROCEDURAL_CATEGORIES,
  countMatchedRoles,
  type ProceduralAnimationDef,
  type ProceduralAnimationId,
  type ProceduralCategory,
} from "@/lib/procedural";
import { useModelStore } from "@/store/modelStore";
import { cn } from "@/lib/utils";

interface AnimationLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREVIEW_HEIGHT_PX = 240;
const TOTAL_ROLE_COUNT = 18;

function useCardInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { root: null, rootMargin: "120px", threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function LibraryAnimationCard({
  id,
  name,
  description,
  duration,
  category,
  disabled,
  added,
  canAdd,
  onAdd,
}: {
  id: ProceduralAnimationId;
  name: string;
  description: string;
  duration: number;
  category: ProceduralCategory;
  disabled: boolean;
  added: boolean;
  canAdd: boolean;
  onAdd: () => void;
}) {
  const Icon = getAnimationIcon(id, category);
  const { ref: previewRef, visible } = useCardInView();
  const shouldPlay = !disabled && visible;

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
      <div
        ref={previewRef}
        className={cn(
          "relative w-full shrink-0 overflow-hidden border-b border-border/50 bg-background-subtle",
          shouldPlay && "ring-1 ring-inset ring-primary/20"
        )}
        style={{ height: PREVIEW_HEIGHT_PX }}
      >
        {shouldPlay ? (
          <AnimationPreviewCanvas
            animationId={id}
            compact
            forceLoop
            autoRotate={false}
            active
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <Icon className={cn("h-10 w-10", disabled ? "text-foreground-muted/35" : "text-primary/50")} />
            {disabled && <span className="text-[10px] text-foreground-muted">Unavailable</span>}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h3 className="truncate text-sm font-semibold text-foreground">{name}</h3>
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-foreground-muted">{description}</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="font-mono text-[11px] text-foreground-muted">{duration.toFixed(1)}s</span>
          <Button
            type="button"
            size="xs"
            className="h-7 gap-1"
            disabled={disabled || added || !canAdd}
            title={!canAdd ? "Load a model to add clips" : undefined}
            onClick={onAdd}
          >
            <Plus className="h-3 w-3" />
            {added ? "Added" : "Add"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function AnimationLibraryModal({ isOpen, onClose }: AnimationLibraryModalProps) {
  const model = useModelStore((s) => s.model);
  const boneMap = useModelStore((s) => s.boneMap);
  const previewBones = useMemo(
    () => (model ? Array.from(boneMap.values()) : getDefaultPreviewBones()),
    [model, boneMap]
  );
  const [category, setCategory] = useState<ProceduralCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [addedIds, setAddedIds] = useState<Set<ProceduralAnimationId>>(new Set());

  const matchedRoles = previewBones.length > 0 ? countMatchedRoles(previewBones) : 0;
  const coveragePct = Math.round((matchedRoles / TOTAL_ROLE_COUNT) * 100);
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return PROCEDURAL_ANIMATIONS.filter((def) => {
      if (category !== "all" && def.category !== category) return false;
      if (!query) return true;
      return (
        def.name.toLowerCase().includes(query) ||
        def.description.toLowerCase().includes(query) ||
        def.id.toLowerCase().includes(query)
      );
    });
  }, [category, query]);

  useEffect(() => {
    if (isOpen) resetDefaultPreviewSource();
  }, [isOpen]);

  const handleAdd = (id: ProceduralAnimationId) => {
    const ok = addLibraryAnimationAsCustom(id);
    if (ok) setAddedIds((prev) => new Set(prev).add(id));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Animation Library"
      icon={<Library className="h-5 w-5 text-primary" />}
      scrollBody={false}
      className="flex h-[min(92vh,880px)] max-h-[92vh] w-full max-w-6xl flex-col"
      bodyClassName="min-h-0 flex-1 overflow-hidden p-4 sm:p-6"
    >
      <div className="flex h-full min-h-0 flex-col gap-4">
        {!model && (
          <p className="shrink-0 rounded-lg border border-border/60 bg-background-subtle px-3 py-2 text-[11px] leading-relaxed text-foreground-muted">
            Previewing on the <span className="font-medium text-foreground">sample rig</span>. Open a model to preview on your character and add clips.
          </p>
        )}

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search animations…"
              className="h-9 w-full rounded-lg border border-border bg-background-subtle py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-foreground-muted focus:border-primary/50 focus:outline-none"
            />
          </div>
          {previewBones.length > 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background-subtle px-3 py-1.5 text-[11px] text-foreground-muted">
              <span>Rig match</span>
              <span className="font-mono font-semibold text-foreground">{coveragePct}%</span>
            </div>
          ) : (
            <p className="text-[11px] text-foreground-muted">No bones — transitions & effects still work.</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors",
              category === "all"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/60 text-foreground-muted hover:text-foreground"
            )}
          >
            All ({PROCEDURAL_ANIMATIONS.length})
          </button>
          {PROCEDURAL_CATEGORIES.map((cat) => {
            const count = PROCEDURAL_ANIMATIONS.filter((def) => def.category === cat.id).length;
            const CatIcon = getCategoryIcon(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors",
                  category === cat.id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/60 text-foreground-muted hover:text-foreground"
                )}
              >
                <CatIcon className="h-3 w-3" />
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-foreground-muted">No animations match your search.</p>
        ) : (
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((def: ProceduralAnimationDef) => (
                <LibraryAnimationCard
                  key={def.id}
                  id={def.id}
                  name={def.name}
                  description={def.description}
                  duration={def.duration}
                  category={def.category}
                  disabled={!canPreviewLibraryAnimation(def.id, previewBones, true)}
                  added={addedIds.has(def.id)}
                  canAdd={Boolean(model)}
                  onAdd={() => handleAdd(def.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
