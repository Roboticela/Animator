import { AppHeader } from "@/components/layout/AppHeader";
import { LoadingOverlay } from "@/components/layout/LoadingOverlay";
import { AppShell } from "@/components/layout/AppShell";
import { ImportDropzone } from "@/components/import/ImportDropzone";
import { useModelStore } from "@/store/modelStore";

export default function App() {
  const model = useModelStore((s) => s.model);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <AppHeader />
      <LoadingOverlay />
      <main className="relative min-h-0 flex-1 overflow-hidden">
        {model ? <AppShell /> : <ImportDropzone />}
      </main>
    </div>
  );
}
