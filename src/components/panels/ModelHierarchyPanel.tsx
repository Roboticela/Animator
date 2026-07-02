import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Box, ChevronDown, ChevronRight, Eye, EyeOff, Layers3, Search, Trash2, X } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";
import { getBoneIcon } from "@/lib/bone-icons";
import { pickBoneFromClick, pickMeshPartFromClick, useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import { boneHasKeyframes } from "@/lib/clip-builder";

type ExplorerTab = "armatures" | "parts";

function Row({
  depth,
  icon: Icon,
  label,
  selected,
  dimmed,
  keyed,
  onClick,
}: {
  depth: number;
  icon: LucideIcon;
  label: string;
  selected?: boolean;
  dimmed?: boolean;
  keyed?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ paddingLeft: 8 + depth * 12 }}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-xs transition-colors",
        selected ? "bg-primary/15 text-primary" : "text-foreground-muted hover:bg-accent hover:text-foreground",
        dimmed && !selected && "opacity-40"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", selected ? "text-primary" : "text-foreground/40")} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {keyed && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" title="Has keyframes" />}
    </button>
  );
}

export function ModelHierarchyPanel() {
  const model = useModelStore((s) => s.model);
  const meshParts = useModelStore((s) => s.meshParts);
  const selectedBoneNames = useModelStore((s) => s.selectedBoneNames);
  const selectedMeshUuids = useModelStore((s) => s.selectedMeshUuids);
  const pickBone = useModelStore((s) => s.pickBone);
  const pickMeshPart = useModelStore((s) => s.pickMeshPart);
  const removeSelectedBones = useModelStore((s) => s.removeSelectedBones);
  const removeSelectedMeshParts = useModelStore((s) => s.removeSelectedMeshParts);
  const toggleSelectedMeshVisibility = useModelStore((s) => s.toggleSelectedMeshVisibility);
  const viewportSelectionTarget = useModelStore((s) => s.viewportSelectionTarget);
  const setViewportSelectionTarget = useModelStore((s) => s.setViewportSelectionTarget);
  const activeClip = useAnimationStore((s) => s.clips.find((c) => c.id === s.activeClipId));

  const tab: ExplorerTab = viewportSelectionTarget === "bones" ? "armatures" : "parts";
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const selectedBoneSet = useMemo(() => new Set(selectedBoneNames), [selectedBoneNames]);
  const selectedMeshSet = useMemo(() => new Set(selectedMeshUuids), [selectedMeshUuids]);
  const groups = useMemo(() => model?.skeletonGroups ?? [], [model]);

  const visibleMeshParts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meshParts;
    return meshParts.filter((p) => p.name.toLowerCase().includes(q));
  }, [meshParts, query]);

  if (!model) return null;

  const selectionCount = tab === "armatures" ? selectedBoneNames.length : selectedMeshUuids.length;

  const confirmRemove = (message: string, action: () => void) => {
    if (window.confirm(message)) action();
  };

  const toggleGroup = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onDelete = () => {
    if (tab === "armatures") {
      confirmRemove(`Delete ${selectedBoneNames.length} bone(s)?`, removeSelectedBones);
    } else {
      confirmRemove(`Delete ${selectedMeshUuids.length} part(s)?`, removeSelectedMeshParts);
    }
  };

  return (
    <Panel title="Explorer" icon={<Layers3 className="h-3.5 w-3.5" />} noPadding bodyClassName="flex min-h-0 flex-col p-0">
      <div className="flex flex-shrink-0 flex-col gap-2 border-b border-border/50 px-2 py-2">
        <div className="flex gap-0.5 rounded-lg border border-border/50 bg-background-subtle p-0.5">
          {(["armatures", "parts"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewportSelectionTarget(id === "armatures" ? "bones" : "parts")}
              className={cn(
                "flex-1 rounded-md py-1.5 text-[11px] font-medium capitalize transition-colors",
                tab === id ? "bg-card text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground"
              )}
            >
              {id}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-8 w-full rounded-lg border border-border bg-background-subtle pl-7 pr-7 text-xs outline-none placeholder:text-foreground-muted focus:border-primary/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-foreground-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {tab === "parts" && (
            <button
              type="button"
              title="Toggle visibility"
              disabled={selectionCount === 0}
              onClick={toggleSelectedMeshVisibility}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border text-foreground-muted transition-colors hover:bg-accent disabled:opacity-40"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            title="Delete selection"
            disabled={selectionCount === 0}
            onClick={onDelete}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border text-foreground-muted transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-1.5">
        {tab === "armatures" && (
          <>
            {groups.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-foreground-muted">No armature</p>
            )}
            {groups.map((group) => {
              const bones = query
                ? group.bones.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()))
                : group.bones;
              if (query && bones.length === 0) return null;
              const open = !collapsed.has(group.id);

              return (
                <div key={group.id} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="flex w-full items-center gap-1 rounded-md px-1 py-1 text-left text-[11px] font-medium text-foreground-muted hover:bg-accent hover:text-foreground"
                  >
                    {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <span className="truncate">{group.rootName}</span>
                  </button>
                  {open &&
                    bones.map((info) => (
                      <Row
                        key={info.uuid}
                        depth={query ? 0 : info.depth}
                        icon={getBoneIcon(info.name, info.depth)}
                        label={info.name}
                        selected={selectedBoneSet.has(info.name)}
                        keyed={activeClip?.editable ? boneHasKeyframes(activeClip.editable, info.name) : false}
                        onClick={(e) => pickBoneFromClick(pickBone, info.name, selectedBoneNames, e)}
                      />
                    ))}
                </div>
              );
            })}
          </>
        )}

        {tab === "parts" && (
          <>
            {meshParts.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-foreground-muted">No mesh parts</p>
            )}
            {visibleMeshParts.map((part) => {
              const hidden = part.mesh.userData._partHidden === true;
              return (
                <Row
                  key={part.uuid}
                  depth={part.depth}
                  icon={hidden ? EyeOff : Box}
                  label={part.name}
                  selected={selectedMeshSet.has(part.uuid)}
                  dimmed={hidden}
                  onClick={(e) => pickMeshPartFromClick(pickMeshPart, part.uuid, selectedMeshUuids, e)}
                />
              );
            })}
          </>
        )}
      </div>
    </Panel>
  );
}
