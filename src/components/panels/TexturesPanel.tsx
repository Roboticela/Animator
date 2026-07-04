import { useEffect, useMemo, useRef, useState } from "react";
import { Box, ImagePlus, Paintbrush, Shapes } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/store/modelStore";
import {
  MATERIAL_PRESETS,
  collectSceneMaterials,
  readPartMaterialColor,
  type SceneMaterialSwatch,
} from "@/lib/scene-materials";
import { isSelectableMeshPart } from "@/lib/mesh-utils";

function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

function SwatchButton({
  swatch,
  active,
  onClick,
  title,
}: {
  swatch: {
    color: string;
    previewUrl?: string | null;
    name?: string;
    colorOpacity?: number;
    materialOpacity?: number;
    opacity?: number;
  };
  active?: boolean;
  onClick: () => void;
  title: string;
}) {
  const materialAlpha = swatch.materialOpacity ?? swatch.opacity ?? 1;
  const opaque = materialAlpha >= 0.999;
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "relative h-10 w-full overflow-hidden rounded-lg border transition-all",
        active ? "border-primary ring-2 ring-primary/30" : "border-border/70 hover:border-primary/40",
        !opaque && "bg-[linear-gradient(45deg,#80808033_25%,transparent_25%,transparent_75%,#80808033_75%,#80808033),linear-gradient(45deg,#80808033_25%,transparent_25%,transparent_75%,#80808033_75%,#80808033)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]"
      )}
      style={{
        backgroundColor: swatch.previewUrl || !opaque ? undefined : swatch.color,
        backgroundImage: swatch.previewUrl ? `url(${swatch.previewUrl})` : undefined,
        backgroundSize: swatch.previewUrl ? "cover" : undefined,
        backgroundPosition: swatch.previewUrl ? "center" : undefined,
      }}
    >
      {!swatch.previewUrl && !opaque && (
        <div className="absolute inset-0" style={{ backgroundColor: swatch.color, opacity: materialAlpha }} />
      )}
      {swatch.previewUrl && <div className="absolute inset-0 bg-black/10" />}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground/45">{children}</p>;
}

export function TexturesPanel({ embedded }: { embedded?: boolean } = {}) {
  const model = useModelStore((s) => s.model);
  const meshParts = useModelStore((s) => s.meshParts);
  const selectedMeshUuids = useModelStore((s) => s.selectedMeshUuids);
  const showMaterials = useModelStore((s) => s.showMaterials);
  const materialRevision = useModelStore((s) => s.materialRevision);
  const setShowMaterials = useModelStore((s) => s.setShowMaterials);
  const setViewportSelectionTarget = useModelStore((s) => s.setViewportSelectionTarget);
  const applyColorToSelectedParts = useModelStore((s) => s.applyColorToSelectedParts);
  const applySceneMaterialToSelectedParts = useModelStore((s) => s.applySceneMaterialToSelectedParts);
  const applyTextureToSelectedParts = useModelStore((s) => s.applyTextureToSelectedParts);

  const textureInputRef = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState("#9099a6");
  const [roughness, setRoughness] = useState(0.72);
  const [metalness, setMetalness] = useState(0.08);
  const [colorOpacity, setColorOpacity] = useState(1);
  const [materialOpacity, setMaterialOpacity] = useState(1);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);

  const selectedParts = useMemo(
    () => meshParts.filter((p) => selectedMeshUuids.includes(p.id) && isSelectableMeshPart(p)),
    [meshParts, selectedMeshUuids]
  );

  const sceneMaterials = useMemo(() => {
    if (!model) return [] as SceneMaterialSwatch[];
    return collectSceneMaterials(model.object3D);
  }, [model, materialRevision]);

  const selectedPartIds = useMemo(
    () => selectedParts.map((p) => p.id).join(","),
    [selectedParts]
  );

  useEffect(() => {
    const current = readPartMaterialColor(selectedParts);
    if (!current) return;
    setColor(current.color);
    setRoughness(current.roughness ?? 0.72);
    setMetalness(current.metalness ?? 0.08);
    setColorOpacity(current.colorOpacity ?? 1);
    setMaterialOpacity(current.materialOpacity ?? current.opacity ?? 1);
    setActiveMaterialId(null);
  }, [selectedPartIds, selectedParts]);

  useEffect(() => {
    if (selectedParts.length === 0 || !isValidHex(color)) return;
    const timer = window.setTimeout(() => {
      applyColorToSelectedParts({ color, roughness, metalness, colorOpacity, materialOpacity });
      setActiveMaterialId(null);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [
    color,
    roughness,
    metalness,
    colorOpacity,
    materialOpacity,
    selectedParts.length,
    applyColorToSelectedParts,
  ]);

  const applyPreset = (preset: (typeof MATERIAL_PRESETS)[number]) => {
    const presetMaterialOpacity = preset.materialOpacity ?? preset.opacity ?? 1;
    setColor(preset.color);
    setRoughness(preset.roughness);
    setMetalness(preset.metalness);
    setColorOpacity(preset.colorOpacity ?? 1);
    setMaterialOpacity(presetMaterialOpacity);
    applyColorToSelectedParts({
      ...preset,
      colorOpacity: preset.colorOpacity ?? 1,
      materialOpacity: presetMaterialOpacity,
    });
    setActiveMaterialId(null);
  };

  const applyMaterial = (swatch: SceneMaterialSwatch) => {
    setActiveMaterialId(swatch.id);
    setColor(swatch.color);
    setRoughness(swatch.roughness);
    setMetalness(swatch.metalness);
    setColorOpacity(swatch.colorOpacity);
    setMaterialOpacity(swatch.materialOpacity);
    applySceneMaterialToSelectedParts(swatch.id);
  };

  const onTexturePick = async (file: File | undefined) => {
    if (!file) return;
    await applyTextureToSelectedParts(file);
    setActiveMaterialId(null);
  };

  const body = !model ? (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-background-subtle/40 px-4 py-10 text-center">
      <Paintbrush className="h-8 w-8 text-foreground/30" />
      <p className="text-sm font-medium text-foreground">No model loaded</p>
      <p className="text-xs text-foreground-muted">Open a model to paint mesh colors and materials.</p>
    </div>
  ) : selectedParts.length === 0 ? (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-background-subtle/40 px-4 py-10 text-center">
      <Box className="h-8 w-8 text-foreground/30" />
      <p className="text-sm font-medium text-foreground">Select mesh parts</p>
      <p className="text-xs leading-relaxed text-foreground-muted">
        Pick one or more parts in the Explorer Mesh tab or viewport, then assign a color or material here.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setViewportSelectionTarget("parts")}
      >
        <Shapes className="h-4 w-4" />
        Switch to mesh selection
      </Button>
    </div>
  ) : (
    <div className="space-y-4">
      {!showMaterials && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          Materials are hidden. Enable them to see your colors in the viewport.
          <button
            type="button"
            className="ml-1 font-medium text-amber-50 underline underline-offset-2"
            onClick={() => setShowMaterials(true)}
          >
            Show materials
          </button>
        </div>
      )}

      <div className="rounded-lg border border-border/60 bg-background-subtle/40 px-3 py-2">
        <p className="text-xs font-medium text-foreground">
          {selectedParts.length} part{selectedParts.length === 1 ? "" : "s"} selected
        </p>
        <p className="mt-0.5 truncate text-[11px] text-foreground-muted">
          {selectedParts.map((p) => p.name).join(", ")}
        </p>
      </div>

      <div className="space-y-2">
        <SectionTitle>Color & surface</SectionTitle>
        <div className="flex items-center gap-2">
          <div className="relative flex-shrink-0">
            <ColorPicker value={color} onChange={setColor} opacity={materialOpacity} title="Pick mesh color" />
          </div>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value.trim())}
            onBlur={() => {
              if (isValidHex(color)) return;
              const current = readPartMaterialColor(selectedParts);
              if (current) setColor(current.color);
            }}
            className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            spellCheck={false}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] text-foreground-muted">Roughness</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={roughness}
              onChange={(e) => setRoughness(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] text-foreground-muted">Metalness</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={metalness}
              onChange={(e) => setMetalness(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <div className="flex items-center justify-between text-[10px] text-foreground-muted">
            <span>Color strength</span>
            <span>{Math.round(colorOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={colorOpacity}
            onChange={(e) => setColorOpacity(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-[10px] text-foreground-muted">
            How strong the tint is. At 0% the surface stays visible without your color.
          </p>
        </label>

        <label className="block space-y-1">
          <div className="flex items-center justify-between text-[10px] text-foreground-muted">
            <span>Material opacity</span>
            <span>{Math.round(materialOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={materialOpacity}
            onChange={(e) => setMaterialOpacity(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-[10px] text-foreground-muted">
            Overall transparency of the whole surface, including any texture.
          </p>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="xs"
            variant={materialOpacity < 0.999 ? "default" : "outline"}
            onClick={() => setMaterialOpacity(0.5)}
          >
            Semi-transparent
          </Button>
          <Button
            type="button"
            size="xs"
            variant={materialOpacity <= 0.05 ? "default" : "outline"}
            onClick={() => setMaterialOpacity(0)}
          >
            Fully transparent
          </Button>
          <Button
            type="button"
            size="xs"
            variant={materialOpacity >= 0.999 ? "default" : "outline"}
            onClick={() => setMaterialOpacity(1)}
          >
            Opaque
          </Button>
        </div>

        <input
          ref={textureInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void onTexturePick(file);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => textureInputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          Load texture image…
        </Button>
      </div>

      <div className="space-y-2">
        <SectionTitle>Presets</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {MATERIAL_PRESETS.map((preset) => (
            <div key={preset.name} className="space-y-1 rounded-lg border border-border/60 p-1.5">
              <SwatchButton
                swatch={{
                  color: preset.color,
                  name: preset.name,
                  materialOpacity: preset.materialOpacity ?? preset.opacity ?? 1,
                }}
                onClick={() => applyPreset(preset)}
                title={preset.name}
              />
              <span className="block truncate text-[10px] text-foreground-muted">{preset.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <SectionTitle>Materials from model</SectionTitle>
        {sceneMaterials.length === 0 ? (
          <p className="text-xs text-foreground-muted">No materials found on this model yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {sceneMaterials.map((swatch) => (
              <div key={swatch.id} className="space-y-1 rounded-lg border border-border/60 p-1.5">
                <SwatchButton
                  swatch={swatch}
                  active={activeMaterialId === swatch.id}
                  onClick={() => applyMaterial(swatch)}
                  title={swatch.name}
                />
                <span className="block truncate text-[10px] text-foreground-muted">{swatch.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return <div className="custom-scrollbar overflow-y-auto p-3 pb-4">{body}</div>;
  }

  return body;
}
