import { FileBox, Layers3 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { useModelStore } from "@/store/modelStore";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-1.5 text-xs last:border-b-0">
      <span className="text-foreground-muted">{label}</span>
      <span className="font-mono font-medium text-foreground">{value}</span>
    </div>
  );
}

export function SceneInfoPanel() {
  const model = useModelStore((s) => s.model);
  if (!model) return null;
  const { stats } = model;

  return (
    <Panel title="Scene Info" icon={<Layers3 className="h-3.5 w-3.5" />}>
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-border/60 bg-background-subtle px-2 py-1.5">
        <FileBox className="h-4 w-4 flex-shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-foreground">{model.sourceName}</div>
          <div className="text-[10px] uppercase tracking-wide text-foreground-muted">{model.sourceExt} model</div>
        </div>
      </div>
      <Stat label="Meshes" value={stats.meshCount} />
      <Stat label="Skinned meshes" value={stats.skinnedMeshCount} />
      <Stat label="Vertices" value={stats.vertexCount.toLocaleString()} />
      <Stat label="Triangles" value={stats.triangleCount.toLocaleString()} />
      <Stat label="Materials" value={stats.materialCount} />
      <Stat label="Armatures" value={model.skeletonGroups.length} />
      <Stat label="Embedded clips" value={model.embeddedClips.length} />
    </Panel>
  );
}
