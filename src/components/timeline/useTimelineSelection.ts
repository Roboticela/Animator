import { useCallback, useMemo, useState } from "react";
import type { TimelineKeyframeRef } from "@/lib/timeline-utils";
import { keyframeId, timeKey } from "@/lib/timeline-utils";

export function useTimelineSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<TimelineKeyframeRef | null>(null);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    setAnchor(null);
  }, []);

  const selectOne = useCallback((ref: TimelineKeyframeRef) => {
    const id = keyframeId(ref);
    setSelectedIds(new Set([id]));
    setAnchor(ref);
  }, []);

  const toggle = useCallback((ref: TimelineKeyframeRef) => {
    const id = keyframeId(ref);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setAnchor(ref);
  }, []);

  const selectRangeOnBone = useCallback(
    (ref: TimelineKeyframeRef, allTimesOnBone: number[]) => {
      if (!anchor || anchor.bone !== ref.bone) {
        selectOne(ref);
        return;
      }
      const t0 = timeKey(anchor.time);
      const t1 = timeKey(ref.time);
      const lo = Math.min(t0, t1);
      const hi = Math.max(t0, t1);
      const ids = allTimesOnBone
        .filter((t) => t >= lo && t <= hi)
        .map((t) => keyframeId({ bone: ref.bone, time: t }));
      setSelectedIds(new Set(ids));
    },
    [anchor, selectOne]
  );

  const selectRangeAcrossBones = useCallback(
    (
      ref: TimelineKeyframeRef,
      boneOrder: string[],
      getTimesOnBone: (bone: string) => number[]
    ) => {
      if (!anchor) {
        selectOne(ref);
        return;
      }
      const ai = boneOrder.indexOf(anchor.bone);
      const bi = boneOrder.indexOf(ref.bone);
      if (ai === -1 || bi === -1) {
        selectOne(ref);
        return;
      }
      const boneLo = Math.min(ai, bi);
      const boneHi = Math.max(ai, bi);
      const timeLo = Math.min(timeKey(anchor.time), timeKey(ref.time));
      const timeHi = Math.max(timeKey(anchor.time), timeKey(ref.time));
      const ids: string[] = [];
      for (let i = boneLo; i <= boneHi; i++) {
        const bone = boneOrder[i];
        getTimesOnBone(bone).forEach((t) => {
          if (t >= timeLo && t <= timeHi) ids.push(keyframeId({ bone, time: t }));
        });
      }
      setSelectedIds(new Set(ids));
    },
    [anchor, selectOne]
  );

  const selectMany = useCallback((refs: TimelineKeyframeRef[]) => {
    setSelectedIds(new Set(refs.map(keyframeId)));
    if (refs.length > 0) setAnchor(refs[refs.length - 1]);
  }, []);

  const addMany = useCallback((refs: TimelineKeyframeRef[]) => {
    if (refs.length === 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      refs.forEach((r) => next.add(keyframeId(r)));
      return next;
    });
    setAnchor(refs[refs.length - 1]);
  }, []);

  const selectAll = useCallback((refs: TimelineKeyframeRef[]) => {
    setSelectedIds(new Set(refs.map(keyframeId)));
    if (refs.length > 0) setAnchor(refs[0]);
  }, []);

  const isSelected = useCallback((ref: TimelineKeyframeRef) => selectedIds.has(keyframeId(ref)), [selectedIds]);

  const selectedRefs = useMemo(() => {
    return Array.from(selectedIds)
      .map((id) => {
        const sep = id.indexOf("|");
        if (sep === -1) return null;
        return { bone: id.slice(0, sep), time: Number(id.slice(sep + 1)) };
      })
      .filter((r): r is TimelineKeyframeRef => r !== null && !Number.isNaN(r.time));
  }, [selectedIds]);

  const primary = selectedRefs.length > 0 ? selectedRefs[selectedRefs.length - 1] : null;

  return {
    selectedIds,
    selectedRefs,
    primary,
    anchor,
    clear,
    selectOne,
    toggle,
    selectRangeOnBone,
    selectRangeAcrossBones,
    selectMany,
    addMany,
    selectAll,
    isSelected,
    count: selectedIds.size,
  };
}
