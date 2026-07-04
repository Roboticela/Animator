import { AppHeader } from "@/components/layout/AppHeader";
import { LoadingOverlay } from "@/components/layout/LoadingOverlay";
import { AppShell } from "@/components/layout/AppShell";
import { ImportDropzone } from "@/components/import/ImportDropzone";
import { TextureFolderPromptModal } from "@/components/modals/TextureFolderPromptModal";
import { useModelStore } from "@/store/modelStore";

export default function App() {
  const model = useModelStore((s) => s.model);
  const hasReferences = useModelStore((s) => s.references.length > 0);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <AppHeader />
      <LoadingOverlay />
      <TextureFolderPromptModal />
      <main className="relative min-h-0 flex-1 overflow-hidden">
        {model || hasReferences ? <AppShell /> : <ImportDropzone />}
      </main>
    </div>
  );
}
