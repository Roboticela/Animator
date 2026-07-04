import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CircleAlert,
  FolderOpen,
  FolderTree,
  Info,
  Link2,
  Loader2,
  Trash2,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { isTauri, openTextureFolderNative } from "@/lib/tauri";
import { useModelStore } from "@/store/modelStore";
import {
  getMaterialIdsForParts,
  type SceneMaterialSwatch,
} from "@/lib/scene-materials";
import {
  auditSceneMaterials,
  summarizeTextureIssues,
  TEXTURE_SLOT_LABELS,
  type MaterialTextureReport,
  type TextureFolderLoadResult,
  type TextureIssue,
  type TextureSlot,
} from "@/lib/texture-maps";
import type { MeshPartInfo } from "@/types/model";

function IssueIcon({ severity }: { severity: TextureIssue["severity"] }) {
  if (severity === "error") return <CircleAlert className="h-3.5 w-3.5 shrink-0 text-red-400" />;
  if (severity === "warning") return <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />;
  return <Info className="h-3.5 w-3.5 shrink-0 text-sky-400" />;
}

function SlotStatus({ loaded, broken, colorSpaceOk }: { loaded: boolean; broken: boolean; colorSpaceOk: boolean }) {
  if (broken) return <span className="text-[10px] font-medium text-red-400">Failed</span>;
  if (loaded && !colorSpaceOk) return <span className="text-[10px] font-medium text-amber-400">Color space</span>;
  if (loaded) return <span className="text-[10px] font-medium text-emerald-400">OK</span>;
  return <span className="text-[10px] text-foreground-muted">Empty</span>;
}

function MaterialTextureCard({
  report,
  allReports,
  sceneMaterials,
}: {
  report: MaterialTextureReport;
  allReports: MaterialTextureReport[];
  sceneMaterials: SceneMaterialSwatch[];
}) {
  const assignTextureSlotToMaterial = useModelStore((s) => s.assignTextureSlotToMaterial);
  const linkMaterialTexture = useModelStore((s) => s.linkMaterialTexture);
  const clearMaterialTextureSlot = useModelStore((s) => s.clearMaterialTextureSlot);
  const fixMaterialTextureColorSpaces = useModelStore((s) => s.fixMaterialTextureColorSpaces);
  const fileInputRefs = useRef<Partial<Record<TextureSlot, HTMLInputElement | null>>>({});

  const linkSources = useMemo(
    () =>
      allReports.filter(
        (r) =>
          r.materialId !== report.materialId &&
          r.slots.some((s) => s.loaded && !s.broken)
      ),
    [allReports, report.materialId]
  );

  const swatch = sceneMaterials.find((s) => s.id === report.materialId);

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        report.issues.some((i) => i.severity === "error")
          ? "border-red-500/35 bg-red-500/5"
          : report.issues.length > 0
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-border/60 bg-background-subtle/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{report.materialName}</p>
          <p className="text-[10px] text-foreground-muted">
            {report.materialType}
            {report.looksWhite ? " · near-white base" : ""}
            {report.meshNames.length > 0 ? ` · ${report.meshNames.slice(0, 2).join(", ")}` : ""}
          </p>
        </div>
        {swatch?.looksWhite && (
          <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium uppercase text-amber-200">
            White?
          </span>
        )}
      </div>

      {report.issues.length > 0 && (
        <ul className="mt-2 space-y-1">
          {report.issues.map((issue) => (
            <li key={issue.id} className="flex items-start gap-1.5 text-[10px] leading-snug text-foreground/85">
              <IssueIcon severity={issue.severity} />
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}

      {report.slots.length > 0 && (
        <div className="mt-3 space-y-2">
          {report.slots.map((slotInfo) => {
            const slot = slotInfo.slot;
            const slotSources = linkSources.filter((r) => {
              const s = r.slots.find((x) => x.slot === slot);
              return s?.loaded && !s.broken;
            });

            return (
              <div key={slot} className="rounded-md border border-border/50 bg-background/40 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-foreground/80">{slotInfo.label}</span>
                  <SlotStatus
                    loaded={slotInfo.loaded}
                    broken={slotInfo.broken}
                    colorSpaceOk={slotInfo.colorSpaceOk}
                  />
                </div>
                <p
                  className={cn(
                    "mt-1 truncate font-mono text-[10px]",
                    slotInfo.broken ? "text-red-300" : "text-foreground-muted"
                  )}
                  title={slotInfo.path ?? undefined}
                >
                  {slotInfo.path ?? "No file linked"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <input
                    ref={(el) => {
                      fileInputRefs.current[slot] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void assignTextureSlotToMaterial(report.materialId, slot, file);
                    }}
                  />
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => fileInputRefs.current[slot]?.click()}
                  >
                    <FolderOpen className="h-3 w-3" />
                    Browse
                  </Button>
                  {slotInfo.assigned && (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => clearMaterialTextureSlot(report.materialId, slot)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </Button>
                  )}
                  {!slotInfo.colorSpaceOk && slotInfo.loaded && (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => fixMaterialTextureColorSpaces(report.materialId)}
                    >
                      <Wrench className="h-3 w-3" />
                      Fix space
                    </Button>
                  )}
                </div>
                {slotSources.length > 0 && (
                  <label className="mt-2 flex items-center gap-1.5">
                    <Link2 className="h-3 w-3 shrink-0 text-foreground-muted" />
                    <select
                      className="min-w-0 flex-1 rounded border border-border bg-background px-1.5 py-1 text-[10px] text-foreground"
                      defaultValue=""
                      onChange={(e) => {
                        const sourceId = e.target.value;
                        e.target.value = "";
                        if (sourceId) linkMaterialTexture(report.materialId, sourceId, slot);
                      }}
                    >
                      <option value="">Link from another material…</option>
                      {slotSources.map((source) => {
                        const sourceSlot = source.slots.find((s) => s.slot === slot);
                        return (
                          <option key={source.materialId} value={source.materialId}>
                            {source.materialName}
                            {sourceSlot?.path ? ` (${sourceSlot.path})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TextureMapsSection({
  selectedParts,
  sceneMaterials,
}: {
  selectedParts: MeshPartInfo[];
  sceneMaterials: SceneMaterialSwatch[];
}) {
  const model = useModelStore((s) => s.model);
  const materialRevision = useModelStore((s) => s.materialRevision);
  const repairAllTextureColorSpaces = useModelStore((s) => s.repairAllTextureColorSpaces);
  const loadTexturesFromFolder = useModelStore((s) => s.loadTexturesFromFolder);
  const textureFolderName = useModelStore((s) => s.textureFolderName);
  const lastTextureFolderLoad = useModelStore((s) => s.lastTextureFolderLoad);
  const textureFolderLoading = useModelStore((s) => s.textureFolderLoading);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const [folderResult, setFolderResult] = useState<TextureFolderLoadResult | null>(null);

  const allReports = useMemo(() => {
    if (!model) return [] as MaterialTextureReport[];
    return auditSceneMaterials(model.object3D, model.sourceExt);
  }, [model, materialRevision]);

  const focusedReports = useMemo(() => {
    if (selectedParts.length === 0) {
      return allReports.filter((r) => r.issues.length > 0);
    }
    const ids = new Set(getMaterialIdsForParts(selectedParts));
    return allReports.filter((r) => ids.has(r.materialId));
  }, [allReports, selectedParts]);

  const summary = useMemo(() => summarizeTextureIssues(allReports), [allReports]);

  if (!model || allReports.length === 0) return null;

  const hasProblems = summary.errors > 0 || summary.warnings > 0;
  const displayFolderResult = folderResult ?? lastTextureFolderLoad;

  const onFolderPick = async (files: File[]) => {
    if (files.length === 0) return;
    try {
      const result = await loadTexturesFromFolder(files);
      setFolderResult(result);
    } catch {
      // loadTexturesFromFolder clears loading state in finally.
    }
  };

  const pickTextureFolder = () => {
    if (textureFolderLoading) return;
    if (isTauri()) {
      void (async () => {
        useModelStore.setState({ textureFolderLoading: true });
        try {
          const files = await openTextureFolderNative();
          if (!files?.length) {
            useModelStore.setState({ textureFolderLoading: false });
            return;
          }
          await onFolderPick(files);
        } catch {
          useModelStore.setState({ textureFolderLoading: false });
        }
      })();
      return;
    }
    folderInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground/45">
          Texture maps & diagnostics
        </p>
        <div className="flex flex-wrap gap-1.5">
          <input
            ref={folderInputRef}
            type="file"
            className="hidden"
            multiple
            // @ts-expect-error webkitdirectory is supported in Chromium/Firefox
            webkitdirectory=""
            directory=""
            onChange={(e) => {
              const list = e.target.files;
              e.target.value = "";
              if (list?.length) void onFolderPick([...list]);
            }}
          />
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={textureFolderLoading}
            onClick={pickTextureFolder}
          >
            {textureFolderLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <FolderTree className="h-3 w-3" />
            )}
            {textureFolderLoading ? "Linking…" : "Load texture folder…"}
          </Button>
          <Button type="button" size="xs" variant="outline" onClick={() => repairAllTextureColorSpaces()}>
            <Wrench className="h-3 w-3" />
            Fix all color spaces
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-[11px] text-foreground-muted">
        <p>
          Select the folder that contains your texture images (e.g. the model&apos;s{" "}
          <span className="font-mono text-foreground/80">textures/</span> folder or its parent). Files are matched by
          path and filename from the model.
        </p>
        {textureFolderName && (
          <p className="mt-1 text-foreground/75">
            Last folder: <span className="font-medium text-foreground">{textureFolderName}</span>
          </p>
        )}
        {displayFolderResult && displayFolderResult.fileCount > 0 && (
          <p
            className={cn(
              "mt-1",
              displayFolderResult.matched > 0 ? "text-emerald-300/90" : "text-foreground/75"
            )}
          >
            {displayFolderResult.matched} texture{displayFolderResult.matched === 1 ? "" : "s"} linked from{" "}
            {displayFolderResult.fileCount} image{displayFolderResult.fileCount === 1 ? "" : "s"}
            {displayFolderResult.failed > 0 && ` · ${displayFolderResult.failed} failed`}
            {displayFolderResult.unmatched.length > 0 &&
              ` · ${displayFolderResult.unmatched.length} path${displayFolderResult.unmatched.length === 1 ? "" : "s"} not found`}
          </p>
        )}
        {displayFolderResult && displayFolderResult.unmatched.length > 0 && (
          <details className="mt-1.5">
            <summary className="cursor-pointer text-[10px] text-foreground/70">Unmatched paths</summary>
            <ul className="mt-1 max-h-24 overflow-y-auto font-mono text-[10px] leading-relaxed text-foreground/65">
              {displayFolderResult.unmatched.map((path) => (
                <li key={path} className="truncate" title={path}>
                  {path}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {hasProblems && (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-xs",
            summary.errors > 0
              ? "border-red-500/35 bg-red-500/10 text-red-100/90"
              : "border-amber-500/30 bg-amber-500/10 text-amber-100/90"
          )}
        >
          <p className="font-medium">
            {summary.errors > 0 && `${summary.errors} error${summary.errors === 1 ? "" : "s"}`}
            {summary.errors > 0 && summary.warnings > 0 && " · "}
            {summary.warnings > 0 && `${summary.warnings} warning${summary.warnings === 1 ? "" : "s"}`}
            {!summary.errors && !summary.warnings && summary.infos > 0 && `${summary.infos} note${summary.infos === 1 ? "" : "s"}`}
          </p>
          <p className="mt-1 text-[11px] opacity-90">
            {model.sourceExt === "fbx" || model.sourceExt === "obj"
              ? "FBX/OBJ models usually need external image files — use Load texture folder or Browse per slot."
              : model.sourceExt === "gltf"
                ? "GLTF may reference separate images — load the textures folder or link files below."
                : "Missing or broken textures often show as white surfaces. Load a texture folder or link files per slot."}
          </p>
        </div>
      )}

      {focusedReports.length === 0 ? (
        <p className="text-xs text-foreground-muted">
          {selectedParts.length === 0
            ? "No texture issues detected on this model."
            : "Selected parts have no texture slots to manage."}
        </p>
      ) : (
        <div className="space-y-2">
          {selectedParts.length > 0 && (
            <p className="text-[10px] text-foreground-muted">
              Materials on selected parts ({focusedReports.length})
            </p>
          )}
          {selectedParts.length === 0 && focusedReports.length > 0 && (
            <p className="text-[10px] text-foreground-muted">
              Materials with issues ({focusedReports.length})
            </p>
          )}
          {focusedReports.map((report) => (
            <MaterialTextureCard
              key={report.materialId}
              report={report}
              allReports={allReports}
              sceneMaterials={sceneMaterials}
            />
          ))}
        </div>
      )}

      <details className="rounded-lg border border-border/50 bg-background-subtle/20 px-3 py-2 text-[10px] text-foreground-muted">
        <summary className="cursor-pointer font-medium text-foreground/70">Why textures look white</summary>
        <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed">
          <li>Pick a whole texture folder to auto-match images by path and name.</li>
          <li>External images missing or moved (common with FBX/OBJ).</li>
          <li>GLB exported without embedded textures.</li>
          <li>Unsupported material types from the source app.</li>
          <li>Wrong sRGB vs linear color space (use Fix color spaces).</li>
          <li>Base color near white with no diffuse map assigned.</li>
        </ul>
        <p className="mt-2">
          Slots: {Object.values(TEXTURE_SLOT_LABELS).join(" · ")}
        </p>
      </details>
    </div>
  );
}
