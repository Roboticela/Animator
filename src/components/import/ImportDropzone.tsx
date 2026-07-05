import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clapperboard,
  Code2,
  FileDown,
  FileUp,
  Loader2,
  Shield,
  Spline,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HtmlTo3dModal } from "@/components/modals/HtmlTo3dModal";
import { useOpenModel } from "@/hooks/useOpenModel";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Spline, title: "Inspect bones", text: "Browse every armature and bone in the hierarchy" },
  { icon: Clapperboard, title: "Play animations", text: "Preview embedded clips and blend between them" },
  { icon: FileDown, title: "Author & export", text: "Hand-key custom clips and export to GLB" },
];

const FORMATS = [".glb", ".gltf", ".fbx", ".obj", ".rcanim"];

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function ImportDropzone() {
  const { openFile, openLocalFile, loadSampleRig, isLoading, error, inputRef, handleInputChange } = useOpenModel();
  const [isDragging, setIsDragging] = useState(false);
  const [htmlTo3dOpen, setHtmlTo3dOpen] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) openLocalFile(file);
    },
    [openLocalFile]
  );

  return (
    <div className="custom-scrollbar relative h-full overflow-y-auto">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--primary) 12%, transparent), transparent),
            linear-gradient(color-mix(in srgb, var(--border) 35%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--border) 35%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 32px 32px, 32px 32px",
        }}
      />

      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="w-full max-w-4xl"
        >
          <motion.header variants={fadeUp} className="mb-8 text-center sm:mb-10">
            <div className="mb-4 inline-flex items-center justify-center rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
              <img src="/favicon.svg" alt="" className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Import a rig</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/55">
              Drop a rigged 3D model to explore its armature, preview animations, and author your own clips.
            </p>
          </motion.header>

          <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
            <motion.div variants={fadeUp} className="lg:col-span-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "group relative flex min-h-[280px] flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 sm:min-h-[320px] sm:p-10",
                  isDragging
                    ? "border-primary bg-primary/5 shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_15%,transparent)]"
                    : "border-border/80 bg-card/70 shadow-sm backdrop-blur-sm hover:border-primary/40 hover:bg-card/90"
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".glb,.gltf,.fbx,.obj,.rcanim"
                  className="hidden"
                  onChange={handleInputChange}
                />

                <motion.div
                  animate={isDragging ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors duration-200",
                    isDragging
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60 bg-background/60 group-hover:border-primary/30 group-hover:bg-primary/5"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <FileUp className="h-8 w-8 text-primary/70" />
                  )}
                </motion.div>

                <div>
                  <p className="text-base font-semibold text-foreground">
                    {isLoading ? "Loading model…" : isDragging ? "Release to import" : "Drag & drop your model"}
                  </p>
                  <p className="mt-1.5 text-xs text-foreground/50">or browse from your computer</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {FORMATS.map((ext) => (
                    <span
                      key={ext}
                      className="rounded-md border border-border/50 bg-background/50 px-2 py-0.5 font-mono text-[10px] text-foreground/45"
                    >
                      {ext}
                    </span>
                  ))}
                </div>

                <Button onClick={openFile} disabled={isLoading} size="sm" className="w-full max-w-xs">
                  <FileUp className="h-4 w-4" />
                  Browse files
                </Button>
              </div>

              {error && (
                <p className="mt-3 text-center text-xs text-danger" role="alert">
                  {error}
                </p>
              )}
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col gap-3 lg:col-span-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void loadSampleRig()}
                className="group flex flex-1 flex-col rounded-2xl border border-border/60 bg-card/70 p-5 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/35 hover:bg-card/90 disabled:opacity-50"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-primary/10">
                    <UserRound className="h-5 w-5 text-primary" />
                  </div>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                    No file needed
                  </span>
                </div>
                <h2 className="text-sm font-semibold text-foreground">Try the sample rig</h2>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-foreground/55">
                  Explore Animator instantly with a built-in procedural humanoid — bones, posing, and animation library included.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary transition-transform group-hover:translate-x-0.5">
                  Load sample rig
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => setHtmlTo3dOpen(true)}
                className="group flex flex-col rounded-2xl border border-border/60 bg-card/70 p-5 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/35 hover:bg-card/90 disabled:opacity-50"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/60">
                  <Code2 className="h-5 w-5 text-foreground/70" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Create from HTML</h2>
                <p className="mt-1 text-xs leading-relaxed text-foreground/55">
                  Turn a webpage into a 3D reference mesh you can pose alongside your rig.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                  Open HTML importer
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="mt-8 grid gap-3 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex gap-3 rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/50">{text}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-foreground/40">
            <Shield className="h-3 w-3" />
            Everything runs locally — your files never leave this app.
          </motion.p>
        </motion.div>
      </div>

      <HtmlTo3dModal isOpen={htmlTo3dOpen} onClose={() => setHtmlTo3dOpen(false)} />
    </div>
  );
}
