import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard, FileDown, FileUp, Loader2, Spline } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOpenModel } from "@/hooks/useOpenModel";

const FEATURES = [
  { icon: Spline, text: "Inspect every armature & bone" },
  { icon: Clapperboard, text: "Instant premade animations" },
  { icon: FileDown, text: "Hand-author custom clips & export to GLB" },
];

export function ImportDropzone() {
  const { openFile, loadFile, isLoading, error, inputRef, handleInputChange } = useOpenModel();
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void loadFile(file);
    },
    [loadFile]
  );

  return (
    <div className="custom-scrollbar flex h-full items-center justify-center overflow-y-auto p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <div className="mb-8 text-center">
          <p className="text-sm text-foreground/50">
            Import a rigged model, explore its bones, and generate animations.
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 sm:p-10 ${
            isDragging ? "border-primary bg-accent/30" : "border-border bg-card hover:border-primary/30"
          }`}
        >
          <input ref={inputRef} type="file" accept=".glb,.gltf,.fbx,.obj" className="hidden" onChange={handleInputChange} />

          {isLoading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <FileUp className="h-10 w-10 text-foreground/40" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {isLoading ? "Loading model…" : "Drag & drop a model here"}
            </p>
            <p className="mt-1 text-xs text-foreground/50">.glb, .gltf, .fbx or .obj</p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={openFile} disabled={isLoading} size="sm" variant="default">
              <FileUp className="h-4 w-4" />
              Browse files
            </Button>
          </motion.div>
        </div>

        {error && <p className="mt-3 text-center text-xs text-danger">{error}</p>}

        <div className="my-6 flex items-center gap-3 text-xs text-foreground/50">
          <div className="h-px flex-1 bg-border" />
          or use Menu → Load Sample Rig
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-xs text-foreground/55"
            >
              <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
              {text}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
