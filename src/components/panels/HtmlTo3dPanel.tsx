import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Code2,
  Copy,
  Eye,
  FileCode2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CSS,
  DEFAULT_HTML,
  DEFAULT_JS,
  generateHtmlTo3dCode,
  type HtmlTo3dCodeTarget,
  type HtmlTo3dSource,
} from "@/lib/html-to-3d";
import { importHtmlPanelToScene, importHtmlReference } from "@/lib/app-actions";
import { useModelStore } from "@/store/modelStore";

type EditorTab = "html" | "css" | "js";
type OutputTab = "preview" | "vanilla" | "react";

function CodeArea({
  label,
  value,
  onChange,
  rows = 10,
  mono = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <label className="flex min-h-0 flex-1 flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground/45">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        rows={rows}
        className={cn(
          "min-h-0 w-full flex-1 resize-y rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
          mono && "font-mono"
        )}
      />
    </label>
  );
}

export function HtmlTo3dPanel({
  embedded,
  mode = "project",
  onApplied,
}: {
  embedded?: boolean;
  mode?: "project" | "reference";
  onApplied?: () => void;
} = {}) {
  const isReference = mode === "reference";
  const model = useModelStore((s) => s.model);
  const isLoading = useModelStore((s) => s.isLoading);

  const [editorTab, setEditorTab] = useState<EditorTab>("html");
  const [outputTab, setOutputTab] = useState<OutputTab>("preview");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(320);
  const [planeWidth, setPlaneWidth] = useState(2);
  const [panelName, setPanelName] = useState("HTML Panel");
  const [previewKey, setPreviewKey] = useState(0);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const source = useMemo<HtmlTo3dSource>(
    () => ({ html, css, js, width, height, planeWidth, name: panelName }),
    [html, css, js, width, height, planeWidth, panelName]
  );

  const generatedVanilla = useMemo(() => generateHtmlTo3dCode(source, "vanilla"), [source]);
  const generatedReact = useMemo(() => generateHtmlTo3dCode(source, "react"), [source]);

  const previewDoc = useMemo(() => {
    const safeCss = css.replace(/<\/style/gi, "<\\/style");
    const safeJs = js.replace(/<\/script/gi, "<\\/script");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{box-sizing:border-box}html,body{margin:0;width:${width}px;min-height:${height}px;overflow:auto;}${safeCss}</style></head><body>${html}<script>try{${safeJs}}catch(e){console.error(e)}<\/script></body></html>`;
  }, [html, css, js, width, height, previewKey]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const refreshPreview = () => {
    setPreviewKey((k) => k + 1);
    setError(null);
  };

  const applyToScene = useCallback(async () => {
    setApplying(true);
    setError(null);
    try {
      if (isReference) {
        await importHtmlReference(source);
      } else {
        await importHtmlPanelToScene(source);
      }
      onApplied?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isReference
            ? "Failed to add HTML reference."
            : "Failed to add HTML panel to the scene."
      );
    } finally {
      setApplying(false);
    }
  }, [isReference, onApplied, source]);

  const copyCode = async (target: HtmlTo3dCodeTarget) => {
    const code = target === "react" ? generatedReact : generatedVanilla;
    await navigator.clipboard.writeText(code);
    setCopied(true);
  };

  const editorTabs: { id: EditorTab; label: string }[] = [
    { id: "html", label: "HTML" },
    { id: "css", label: "CSS" },
    { id: "js", label: "JavaScript" },
  ];

  const outputTabs: { id: OutputTab; label: string; icon: typeof Eye }[] = [
    { id: "preview", label: "2D preview", icon: Eye },
    { id: "vanilla", label: "Vanilla Three.js", icon: FileCode2 },
    { id: "react", label: "React R3F", icon: Code2 },
  ];

  const body = (
    <div className={cn("flex flex-col gap-3", embedded ? "p-3" : "")}>
      <p className="text-xs leading-relaxed text-foreground-muted">
        Write HTML, CSS, and JavaScript — preview it in 2D, apply it as a textured 3D plane in the
        viewport, or copy generated <span className="text-foreground">Vanilla Three.js</span> or{" "}
        <span className="text-foreground">React Three Fiber</span> code.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="space-y-1">
          <span className="text-[10px] text-foreground-muted">Canvas W</span>
          <input
            type="number"
            min={64}
            max={4096}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value) || 512)}
            className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] text-foreground-muted">Canvas H</span>
          <input
            type="number"
            min={64}
            max={4096}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value) || 320)}
            className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] text-foreground-muted">3D width</span>
          <input
            type="number"
            min={0.1}
            max={20}
            step={0.1}
            value={planeWidth}
            onChange={(e) => setPlaneWidth(Number(e.target.value) || 2)}
            className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] text-foreground-muted">Mesh name</span>
          <input
            type="text"
            value={panelName}
            onChange={(e) => setPanelName(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
          />
        </label>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <div className="flex min-h-[280px] flex-col gap-2 rounded-xl border border-border/60 bg-background-subtle/30 p-2">
          <div className="flex flex-wrap gap-1">
            {editorTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEditorTab(tab.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  editorTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground-muted hover:bg-card hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {editorTab === "html" && <CodeArea label="HTML" value={html} onChange={setHtml} rows={14} />}
          {editorTab === "css" && <CodeArea label="CSS" value={css} onChange={setCss} rows={14} />}
          {editorTab === "js" && <CodeArea label="JavaScript" value={js} onChange={setJs} rows={14} />}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="xs" variant="outline" onClick={refreshPreview}>
              <Eye className="h-3 w-3" />
              Refresh preview
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={applying || isLoading}
              onClick={() => void applyToScene()}
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {applying
                ? "Building 3D…"
                : isReference
                  ? "Add as reference"
                  : model
                    ? "Add to scene"
                    : "Create 3D scene"}
            </Button>
          </div>
        </div>

        <div className="flex min-h-[280px] flex-col gap-2 rounded-xl border border-border/60 bg-background-subtle/30 p-2">
          <div className="flex flex-wrap gap-1">
            {outputTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setOutputTab(tab.id)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  outputTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground-muted hover:bg-card hover:text-foreground"
                )}
              >
                <tab.icon className="h-3 w-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {outputTab === "preview" && (
            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border/50 bg-[#111]">
              <iframe
                key={previewKey}
                title="HTML preview"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={previewDoc}
                className="h-full min-h-[240px] w-full bg-white"
                style={{ width, maxWidth: "100%" }}
              />
            </div>
          )}

          {(outputTab === "vanilla" || outputTab === "react") && (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <textarea
                readOnly
                value={outputTab === "react" ? generatedReact : generatedVanilla}
                className="custom-scrollbar min-h-[240px] flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] leading-relaxed text-foreground"
              />
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => void copyCode(outputTab === "react" ? "react" : "vanilla")}
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy code"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {!model && !isReference && (
        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-background-subtle/40 px-3 py-2 text-[11px] text-foreground-muted">
          <Box className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            No model loaded yet — <strong className="text-foreground">Create 3D scene</strong> will start a new
            scene with your HTML panel. You can also add panels to an existing model.
          </span>
        </div>
      )}

      {isReference && (
        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-background-subtle/40 px-3 py-2 text-[11px] text-foreground-muted">
          <Box className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            References are viewport guides only — they can be moved and scaled in the scene but are{" "}
            <strong className="text-foreground">not saved</strong> with the project or export.
          </span>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return <div className="custom-scrollbar overflow-y-auto">{body}</div>;
  }

  return body;
}
