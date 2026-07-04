import { useModelStore } from "@/store/modelStore";

/** Session-only reference objects — not part of the saved project. */
export function ReferencesRenderer() {
  const references = useModelStore((s) => s.references);

  if (references.length === 0) return null;

  return (
    <group name="References">
      {references.map((ref) =>
        ref.visible ? <primitive key={ref.id} object={ref.root} /> : null
      )}
    </group>
  );
}
