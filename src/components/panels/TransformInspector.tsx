import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Bone, Mesh } from "three";
import {
  Box,
  ClipboardPaste,
  Copy,
  Diamond,
  Image,
  Link2,
  Maximize2,
  Move3d,
  RotateCcw,
  RotateCw,
  Unlink2,
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { NumberInput } from "@/components/ui/NumberInput";
import { FeedbackButton } from "@/components/ui/FeedbackButton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useModelStore, getPrimaryBoneName, getPrimaryMeshPartId, getPrimaryReferenceId } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import {
  resetSelectedBones,
  setKeyframesForSelection,
} from "@/lib/app-actions";
import { updateBoneHierarchy } from "@/lib/bone-transform";
import { updateObjectHierarchy } from "@/lib/object-transform";
import { isSelectableMeshPart } from "@/lib/mesh-utils";
import {
  copyText,
  formatTransform,
  formatVec3,
  parseTransform,
  parseVec3,
  readClipboardText,
  type Vec3,
} from "@/lib/transform-clipboard";

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;
const AXIS_COLORS = { x: "#f87171", y: "#4ade80", z: "#60a5fa" };

interface TransformValues {
  position: Vec3;
  rotationDeg: Vec3;
  scale: Vec3;
}

function TransformShell({
  embedded,
  children,
}: {
  embedded?: boolean;
  children: ReactNode;
}) {
  if (embedded) {
    return <div className="p-3 pb-4">{children}</div>;
  }
  return (
    <Panel title="Transform" icon={<Move3d className="h-3.5 w-3.5" />}>
      {children}
    </Panel>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof Move3d; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-background-subtle/40 px-4 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-foreground-muted">{description}</p>
      </div>
    </div>
  );
}

function NoSelectionEmpty({ mode }: { mode: "bones" | "parts" | "references" }) {
  if (mode === "parts") {
    return (
      <EmptyState
        icon={Box}
        title="Nothing selected"
        description="Select a mesh part in the explorer or viewport. Use Object mode (1) and W/E/R to move, rotate, or scale."
      />
    );
  }

  if (mode === "references") {
    return (
      <EmptyState
        icon={Image}
        title="Nothing selected"
        description="Select a reference in the References tab or viewport. References are viewport guides only and are not saved with the project."
      />
    );
  }

  return (
    <EmptyState
      icon={Move3d}
      title="Nothing selected"
      description="Select a bone or mesh part in the explorer or viewport. W/E/R switches the gizmo — K keyframes bones on a custom clip."
    />
  );
}

function ToolbarButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="h-7 flex-1 gap-1.5 rounded-lg text-[10px]"
    >
      {children}
    </Button>
  );
}

function SectionClipboardButtons({
  copyTitle,
  pasteTitle,
  onCopy,
  onPaste,
}: {
  copyTitle: string;
  pasteTitle: string;
  onCopy: () => void;
  onPaste: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        title={copyTitle}
        onClick={onCopy}
        className="rounded-md p-1 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
        aria-label={copyTitle}
      >
        <Copy className="h-3 w-3" />
      </button>
      <button
        type="button"
        title={pasteTitle}
        onClick={onPaste}
        className="rounded-md p-1 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
        aria-label={pasteTitle}
      >
        <ClipboardPaste className="h-3 w-3" />
      </button>
    </div>
  );
}

function TransformSection({
  title,
  icon: Icon,
  onReset,
  resetTitle,
  onCopyAll,
  onPasteAll,
  children,
}: {
  title: string;
  icon: typeof Move3d;
  onReset?: () => void;
  resetTitle?: string;
  onCopyAll?: () => void;
  onPasteAll?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="mb-3 overflow-hidden rounded-xl border border-border/60 bg-card/50 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-background-subtle/50 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          <Icon className="h-3.5 w-3.5 text-primary/80" />
          {title}
        </div>
        <div className="flex items-center gap-0.5">
          {onCopyAll && onPasteAll && (
            <SectionClipboardButtons
              copyTitle={`Copy all ${title.toLowerCase()}`}
              pasteTitle={`Paste all ${title.toLowerCase()}`}
              onCopy={onCopyAll}
              onPaste={onPasteAll}
            />
          )}
          {onReset && (
            <button
              type="button"
              title={resetTitle ?? `Reset ${title.toLowerCase()}`}
              onClick={onReset}
              className="rounded-md p-1 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="p-2.5">{children}</div>
    </section>
  );
}

function TransformRow({
  values,
  step,
  precision = 3,
  onChange,
}: {
  values: Vec3;
  step: number;
  precision?: number;
  onChange: (index: number, value: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {(["x", "y", "z"] as const).map((axis, i) => (
        <NumberInput
          key={axis}
          label={axis.toUpperCase()}
          accent={AXIS_COLORS[axis]}
          value={values[i]}
          step={step}
          precision={precision}
          showSteppers
          showClipboard
          onChange={(v) => onChange(i, v)}
        />
      ))}
    </div>
  );
}

function TransformEditor({
  multiCount,
  values,
  onPosition,
  onRotation,
  onScale,
  onResetAll,
  uniformScale,
  onUniformScaleChange,
  showKeyframe,
  canKeyframe,
}: {
  multiCount: number;
  values: TransformValues;
  onPosition: (index: number, value: number) => void;
  onRotation: (index: number, value: number) => void;
  onScale: (index: number, value: number) => void;
  onResetAll?: () => void;
  uniformScale: boolean;
  onUniformScaleChange: (linked: boolean) => void;
  showKeyframe?: boolean;
  canKeyframe?: boolean;
}) {
  const [allCopied, setAllCopied] = useState(false);

  const applyVec3 = (vec: Vec3, apply: (index: number, value: number) => void) => {
    for (let i = 0; i < 3; i++) apply(i, vec[i]!);
  };

  const copyVec3 = async (vec: Vec3, precision: number) => {
    await copyText(formatVec3(vec, precision));
  };

  const pasteVec3 = async (apply: (index: number, value: number) => void) => {
    const text = await readClipboardText();
    if (!text) return;
    const vec = parseVec3(text);
    if (!vec) return;
    applyVec3(vec, apply);
  };

  const copyAllTransform = async () => {
    const ok = await copyText(formatTransform(values));
    if (ok) {
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 1200);
    }
  };

  const pasteAllTransform = async () => {
    const text = await readClipboardText();
    if (!text) return;
    const parsed = parseTransform(text);
    if (!parsed) return;
    if (parsed.position) applyVec3(parsed.position, onPosition);
    if (parsed.rotationDeg) applyVec3(parsed.rotationDeg, onRotation);
    if (parsed.scale) {
      if (uniformScale && parsed.scale[0] != null) {
        const avg = parsed.scale[0];
        for (let i = 0; i < 3; i++) onScale(i, avg);
      } else {
        applyVec3(parsed.scale, onScale);
      }
    }
  };

  const handleScale = (index: number, value: number) => {
    if (!uniformScale) {
      onScale(index, value);
      return;
    }
    const prev = values.scale[index]!;
    if (Math.abs(prev) < 1e-8) {
      onScale(index, value);
      return;
    }
    const ratio = value / prev;
    for (let i = 0; i < 3; i++) onScale(i, values.scale[i]! * ratio);
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1 rounded-lg border border-border/50 bg-background-subtle/40 p-1">
        <ToolbarButton title={allCopied ? "Copied!" : "Copy position, rotation & scale"} onClick={copyAllTransform}>
          <Copy className="h-3 w-3" />
          {allCopied ? "Copied" : "Copy all"}
        </ToolbarButton>
        <ToolbarButton title="Paste position, rotation & scale" onClick={pasteAllTransform}>
          <ClipboardPaste className="h-3 w-3" />
          Paste all
        </ToolbarButton>
        {onResetAll && (
          <ToolbarButton title="Reset to bind pose (Home)" onClick={onResetAll}>
            <RotateCcw className="h-3 w-3" />
            Reset
          </ToolbarButton>
        )}
      </div>

      <TransformSection
        title="Position"
        icon={Move3d}
        resetTitle="Zero position"
        onCopyAll={() => copyVec3(values.position, 3)}
        onPasteAll={() => pasteVec3(onPosition)}
        onReset={() => {
          for (let i = 0; i < 3; i++) onPosition(i, 0);
        }}
      >
        <TransformRow values={values.position} step={0.01} precision={3} onChange={onPosition} />
      </TransformSection>

      <TransformSection
        title="Rotation"
        icon={RotateCw}
        resetTitle="Zero rotation"
        onCopyAll={() => copyVec3(values.rotationDeg, 2)}
        onPasteAll={() => pasteVec3(onRotation)}
        onReset={() => {
          for (let i = 0; i < 3; i++) onRotation(i, 0);
        }}
      >
        <TransformRow values={values.rotationDeg} step={1} precision={2} onChange={onRotation} />
        <p className="mt-1.5 text-[10px] text-foreground-muted/80">Euler degrees · Shift/Alt on ± for ×10 / ×0.1</p>
      </TransformSection>

      <TransformSection
        title="Scale"
        icon={Maximize2}
        resetTitle="Reset scale to 1"
        onCopyAll={() => copyVec3(values.scale, 3)}
        onPasteAll={async () => {
          const text = await readClipboardText();
          if (!text) return;
          const vec = parseVec3(text);
          if (!vec) return;
          if (uniformScale) handleScale(0, vec[0]!);
          else applyVec3(vec, onScale);
        }}
        onReset={() => {
          for (let i = 0; i < 3; i++) onScale(i, 1);
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-foreground-muted">Uniform</span>
          <button
            type="button"
            title={uniformScale ? "Unlink axes" : "Link axes (uniform scale)"}
            onClick={() => onUniformScaleChange(!uniformScale)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
              uniformScale
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/60 bg-background-subtle text-foreground-muted hover:text-foreground"
            )}
          >
            {uniformScale ? <Link2 className="h-3 w-3" /> : <Unlink2 className="h-3 w-3" />}
            {uniformScale ? "Linked" : "Per axis"}
          </button>
        </div>
        <TransformRow values={values.scale} step={0.01} precision={3} onChange={handleScale} />
      </TransformSection>

      {showKeyframe && (
        <FeedbackButton
          variant={canKeyframe ? "default" : "outline"}
          size="sm"
          disabled={!canKeyframe}
          onPress={() => setKeyframesForSelection()}
          className="mt-1 w-full"
          title={
            canKeyframe
              ? multiCount > 1
                ? "Add keyframes for all selected bones (K)"
                : "Add a keyframe for this bone (K)"
              : "Select or create a custom clip to keyframe poses"
          }
        >
          <Diamond className="h-3.5 w-3.5" />
          {multiCount > 1 ? `Set Keyframes (${multiCount})` : "Set Keyframe"}
        </FeedbackButton>
      )}
    </>
  );
}

export function TransformInspector({ embedded }: { embedded?: boolean } = {}) {
  const boneMap = useModelStore((s) => s.boneMap);
  const meshParts = useModelStore((s) => s.meshParts);
  const selectedBoneNames = useModelStore((s) => s.selectedBoneNames);
  const selectedMeshUuids = useModelStore((s) => s.selectedMeshUuids);
  const references = useModelStore((s) => s.references);
  const selectedReferenceIds = useModelStore((s) => s.selectedReferenceIds);
  const viewportSelectionTarget = useModelStore((s) => s.viewportSelectionTarget);
  const meshElementMode = useModelStore((s) => s.meshElementMode);

  const activeClip = useAnimationStore((s) => s.clips.find((c) => c.id === s.activeClipId));

  const editingReferences = viewportSelectionTarget === "references";
  const editingParts = viewportSelectionTarget === "parts" && meshElementMode === "object";
  const [uniformScale, setUniformScale] = useState(true);

  const primaryName = getPrimaryBoneName(selectedBoneNames);
  const bone = primaryName ? boneMap.get(primaryName)?.bone : undefined;

  const primaryPartId = getPrimaryMeshPartId(selectedMeshUuids);
  const primaryPart = primaryPartId ? meshParts.find((p) => p.id === primaryPartId && isSelectableMeshPart(p)) : undefined;
  const primaryMesh = primaryPart?.mesh;

  const primaryRefId = getPrimaryReferenceId(selectedReferenceIds);
  const primaryReference = primaryRefId ? references.find((ref) => ref.id === primaryRefId) : undefined;

  const selectedMeshes = useMemo(() => {
    const meshes = new Map<string, Mesh>();
    for (const id of selectedMeshUuids) {
      const part = meshParts.find((p) => p.id === id && isSelectableMeshPart(p));
      if (part?.mesh) meshes.set(part.mesh.uuid, part.mesh);
    }
    return [...meshes.values()];
  }, [meshParts, selectedMeshUuids]);

  const selectedBones = useMemo(
    () =>
      selectedBoneNames
        .map((name) => boneMap.get(name)?.bone)
        .filter((b): b is Bone => Boolean(b)),
    [selectedBoneNames, boneMap]
  );

  const selectedReferenceRoots = useMemo(() => {
    return selectedReferenceIds
      .map((id) => references.find((ref) => ref.id === id)?.root)
      .filter((root): root is import("three").Object3D => Boolean(root));
  }, [references, selectedReferenceIds]);

  const targetId = editingReferences
    ? primaryRefId
    : editingParts
      ? primaryMesh?.uuid ?? null
      : primaryName;

  const [, setTick] = useState(0);
  const refreshValues = () => setTick((n) => n + 1);
  useEffect(() => {
    if (!targetId) return;
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 66) {
        last = t;
        setTick((n) => n + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [targetId, editingParts, editingReferences]);

  if (editingReferences) {
    if (!primaryReference?.root) {
      return (
        <TransformShell embedded={embedded}>
          <NoSelectionEmpty mode="references" />
        </TransformShell>
      );
    }

    const applyToReferences = (fn: (root: import("three").Object3D) => void) => {
      for (const root of selectedReferenceRoots) fn(root);
      updateObjectHierarchy(selectedReferenceRoots);
    };

    return (
      <TransformShell embedded={embedded}>
        <TransformEditor
          multiCount={selectedReferenceRoots.length}
          values={{
            position: [
              primaryReference.root.position.x,
              primaryReference.root.position.y,
              primaryReference.root.position.z,
            ],
            rotationDeg: [
              primaryReference.root.rotation.x * RAD2DEG,
              primaryReference.root.rotation.y * RAD2DEG,
              primaryReference.root.rotation.z * RAD2DEG,
            ],
            scale: [
              primaryReference.root.scale.x,
              primaryReference.root.scale.y,
              primaryReference.root.scale.z,
            ],
          }}
          uniformScale={uniformScale}
          onUniformScaleChange={setUniformScale}
          onPosition={(i, v) => {
            applyToReferences((root) => root.position.setComponent(i, v));
            refreshValues();
          }}
          onRotation={(i, v) => {
            const rad = v * DEG2RAD;
            applyToReferences((root) => {
              if (i === 0) root.rotation.x = rad;
              else if (i === 1) root.rotation.y = rad;
              else root.rotation.z = rad;
            });
            refreshValues();
          }}
          onScale={(i, v) => {
            applyToReferences((root) => root.scale.setComponent(i, v));
            refreshValues();
          }}
        />
      </TransformShell>
    );
  }

  if (editingParts) {
    if (!primaryMesh || !primaryPart) {
      return (
        <TransformShell embedded={embedded}>
        <NoSelectionEmpty mode="parts" />
        </TransformShell>
      );
    }

    const applyToMeshes = (fn: (mesh: Mesh) => void) => {
      for (const mesh of selectedMeshes) fn(mesh);
      updateObjectHierarchy(selectedMeshes);
    };

    return (
      <TransformShell embedded={embedded}>
        <TransformEditor
          multiCount={selectedMeshes.length}
          values={{
            position: [primaryMesh.position.x, primaryMesh.position.y, primaryMesh.position.z],
            rotationDeg: [
              primaryMesh.rotation.x * RAD2DEG,
              primaryMesh.rotation.y * RAD2DEG,
              primaryMesh.rotation.z * RAD2DEG,
            ],
            scale: [primaryMesh.scale.x, primaryMesh.scale.y, primaryMesh.scale.z],
          }}
          uniformScale={uniformScale}
          onUniformScaleChange={setUniformScale}
          onPosition={(i, v) => {
            applyToMeshes((m) => m.position.setComponent(i, v));
            refreshValues();
          }}
          onRotation={(i, v) => {
            const rad = v * DEG2RAD;
            applyToMeshes((m) => {
              if (i === 0) m.rotation.x = rad;
              else if (i === 1) m.rotation.y = rad;
              else m.rotation.z = rad;
            });
            refreshValues();
          }}
          onScale={(i, v) => {
            applyToMeshes((m) => m.scale.setComponent(i, v));
            refreshValues();
          }}
        />
      </TransformShell>
    );
  }

  if (!primaryName || !bone) {
    return (
      <TransformShell embedded={embedded}>
        <NoSelectionEmpty mode="bones" />
      </TransformShell>
    );
  }

  const canKeyframe = activeClip?.source === "custom" && Boolean(activeClip.editable);

  const applyToAll = (fn: (b: Bone) => void) => {
    for (const b of selectedBones) fn(b);
    updateBoneHierarchy(selectedBones);
  };

  return (
    <TransformShell embedded={embedded}>
      <TransformEditor
        multiCount={selectedBoneNames.length}
        values={{
          position: [bone.position.x, bone.position.y, bone.position.z],
          rotationDeg: [bone.rotation.x * RAD2DEG, bone.rotation.y * RAD2DEG, bone.rotation.z * RAD2DEG],
          scale: [bone.scale.x, bone.scale.y, bone.scale.z],
        }}
        uniformScale={uniformScale}
        onUniformScaleChange={setUniformScale}
        onPosition={(i, v) => {
          applyToAll((b) => b.position.setComponent(i, v));
          refreshValues();
        }}
        onRotation={(i, v) => {
          const rad = v * DEG2RAD;
          applyToAll((b) => {
            if (i === 0) b.rotation.x = rad;
            else if (i === 1) b.rotation.y = rad;
            else b.rotation.z = rad;
          });
          refreshValues();
        }}
        onScale={(i, v) => {
          applyToAll((b) => b.scale.setComponent(i, v));
          refreshValues();
        }}
        onResetAll={() => resetSelectedBones()}
        showKeyframe
        canKeyframe={canKeyframe}
      />
    </TransformShell>
  );
}
