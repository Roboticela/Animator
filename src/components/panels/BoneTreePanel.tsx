import { useMemo, useState } from "react";
import { Bone as BoneIcon, Search, X } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import { boneHasKeyframes } from "@/lib/clip-builder";

export function BoneTreePanel() {
  const model = useModelStore((s) => s.model);
  const selectedBoneName = useModelStore((s) => s.selectedBoneName);
  const selectBone = useModelStore((s) => s.selectBone);
  const activeClip = useAnimationStore((s) => s.clips.find((c) => c.id === s.activeClipId));
  const [query, setQuery] = useState("");

  const groups = useMemo(() => model?.skeletonGroups ?? [], [model]);
  const totalBones = useMemo(() => groups.reduce((n, g) => n + g.bones.length, 0), [groups]);

  if (!model) return null;

  return (
    <Panel title="Armatures & Bones" icon={<BoneIcon className="h-3.5 w-3.5" />} noPadding>
      <div className="flex flex-col gap-2 border-b border-border/60 p-2">
        <div className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background-subtle px-2">
          <Search className="h-3.5 w-3.5 text-foreground-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bones..."
            className="h-full min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-foreground-muted"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-foreground-muted hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="text-[11px] text-foreground-muted">
          {groups.length === 0
            ? "No armature found in this file."
            : `${groups.length} armature${groups.length > 1 ? "s" : ""} • ${totalBones} bones`}
        </div>
      </div>

      <div className="p-1.5">
        {groups.length === 0 && (
          <p className="p-2 text-xs leading-relaxed text-foreground-muted">
            This model has no skeleton/bones, so it can only be viewed and exported — animation tools need a rigged
            (skinned) model. Try the sample rig from the Import screen to explore bone posing and animation.
          </p>
        )}

        {groups.map((group) => {
          const visibleBones = query
            ? group.bones.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()))
            : group.bones;
          if (query && visibleBones.length === 0) return null;

          return (
            <div key={group.id} className="mb-1.5">
              <div className="px-1.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                {group.rootName}
              </div>
              {visibleBones.map((info) => {
                const isSelected = info.name === selectedBoneName;
                const keyed = activeClip?.editable ? boneHasKeyframes(activeClip.editable, info.name) : false;
                return (
                  <button
                    key={info.uuid}
                    onClick={() => selectBone(isSelected ? null : info.name)}
                    style={{ paddingLeft: query ? 8 : 8 + info.depth * 14 }}
                    className={cn(
                      "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-xs transition-colors",
                      isSelected ? "bg-primary/15 text-primary" : "text-foreground-muted hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", isSelected ? "bg-primary" : "bg-border")} />
                    <span className="truncate">{info.name}</span>
                    {keyed && <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" title="Has keyframes in active clip" />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
