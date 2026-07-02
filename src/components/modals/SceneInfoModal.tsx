import { Bone, Box, FileBox, Film, Layers3, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useModelStore } from "@/store/modelStore";
import { isSelectableMeshPart } from "@/lib/mesh-utils";
import { useAnimationStore } from "@/store/animationStore";
import { cn } from "@/lib/utils";

interface SceneInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Box;
  label: string;
  value: string | number;
  accent?: "primary" | "secondary";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background-subtle/50 px-3 py-2.5">
      <div
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border",
          accent === "secondary"
            ? "border-secondary/30 bg-secondary/10 text-secondary"
            : "border-primary/25 bg-primary/10 text-primary"
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">{label}</div>
        <div className="truncate font-mono text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function SceneInfoModal({ isOpen, onClose }: SceneInfoModalProps) {
  const model = useModelStore((s) => s.model);
  const meshParts = useModelStore((s) => s.meshParts);
  const sceneRadius = useModelStore((s) => s.sceneRadius);
  const clips = useAnimationStore((s) => s.clips);

  if (!model) return null;

  const { stats } = model;
  const customClips = clips.filter((c) => c.source === "custom").length;
  const totalBones = model.skeletonGroups.reduce((n, g) => n + g.bones.length, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scene Info" icon={<Layers3 className="h-5 w-5 text-primary" />} className="max-w-md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-r from-primary/5 to-transparent px-3 py-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
            <FileBox className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{model.sourceName}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wider text-foreground-muted">
              {model.sourceExt} · bounding radius {sceneRadius.toFixed(2)}m
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Geometry</h3>
          <div className="grid grid-cols-2 gap-2">
            <StatCard icon={Box} label="Meshes" value={stats.meshCount} />
            <StatCard icon={Sparkles} label="Skinned" value={stats.skinnedMeshCount} accent="secondary" />
            <StatCard icon={Box} label="Parts (live)" value={meshParts.filter(isSelectableMeshPart).length} />
            <StatCard icon={Layers3} label="Materials" value={stats.materialCount} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Vertices</div>
              <div className="mt-0.5 font-mono text-base font-semibold text-foreground">{stats.vertexCount.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Triangles</div>
              <div className="mt-0.5 font-mono text-base font-semibold text-foreground">{stats.triangleCount.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Rig & animation</h3>
          <div className="grid grid-cols-2 gap-2">
            <StatCard icon={Bone} label="Armatures" value={model.skeletonGroups.length} />
            <StatCard icon={Bone} label="Bones" value={totalBones} accent="secondary" />
            <StatCard icon={Film} label="Embedded clips" value={model.embeddedClips.length} />
            <StatCard icon={Film} label="Custom clips" value={customClips} accent="secondary" />
          </div>
        </div>

        {model.skeletonGroups.length > 0 && (
          <div>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Armature roots</h3>
            <ul className="space-y-1 rounded-xl border border-border/50 bg-background-subtle/30 p-2">
              {model.skeletonGroups.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-foreground/80"
                >
                  <span className="truncate font-medium">{g.rootName}</span>
                  <span className="ml-2 flex-shrink-0 font-mono text-[10px] text-foreground-muted">{g.bones.length} bones</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
