import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layers } from "lucide-react";
import { TimelineGrid } from "@/components/timeline/TimelineGrid";
import { TimelinePlayhead } from "@/components/timeline/TimelinePlayhead";
import { TimelinePlayRange } from "@/components/timeline/TimelinePlayRange";
import { TimelineToolbar } from "@/components/timeline/TimelineToolbar";
import { TimelineTrackLabel, TimelineTrackRow } from "@/components/timeline/TimelineTrackRow";
import { useTimelineSelection } from "@/components/timeline/useTimelineSelection";
import { useAnimationStore } from "@/store/animationStore";
import { useModelStore } from "@/store/modelStore";
import {
  deleteBoneKeyframes,
  getAnimatedBoneNames,
  getBoneKeyframeEasings,
  getBoneKeyframeTimes,
  getPoseEasing,
  moveBoneKeyframe,
  moveBoneKeyframes,
  removeBoneTrack,
} from "@/lib/clip-builder";
import { duplicateClipAsCustom } from "@/lib/app-actions";
import {
  TIMELINE_LABEL_WIDTH,
  TIMELINE_RULER_HEIGHT,
  TIMELINE_ROW_HEIGHT,
  pxToTime,
  snapTime,
  timeKey,
  timeToPx,
} from "@/lib/timeline-utils";
import { zoomTimelineByFactor } from "@/lib/timeline-zoom";

export function TimelinePanel() {
  const clips = useAnimationStore((s) => s.clips);
  const activeClipId = useAnimationStore((s) => s.activeClipId);
  const seek = useAnimationStore((s) => s.seek);
  const currentTime = useAnimationStore((s) => s.currentTime);
  const duration = useAnimationStore((s) => s.duration);
  const timelineZoom = useAnimationStore((s) => s.timelineZoom);
  const updateCustomClipData = useAnimationStore((s) => s.updateCustomClipData);
  const pickBone = useModelStore((s) => s.pickBone);
  const selectedBoneNames = useModelStore((s) => s.selectedBoneNames);
  const selectedBoneSet = useMemo(() => new Set(selectedBoneNames), [selectedBoneNames]);

  const selection = useTimelineSelection();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const labelsScrollRef = useRef<HTMLDivElement>(null);
  const setTimelineViewportWidth = useAnimationStore((s) => s.setTimelineViewportWidth);
  const [marquee, setMarquee] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [snapToFrames, setSnapToFrames] = useState(true);

  const activeClip = clips.find((c) => c.id === activeClipId);
  const isEditable = activeClip?.source === "custom" && Boolean(activeClip.editable);
  const fps = activeClip?.editable?.fps ?? 30;
  const clipDuration = duration || activeClip?.duration || 1;
  const contentWidth = Math.max(clipDuration * timelineZoom + 80, 400);

  const animatedBones = useMemo(
    () => (activeClip?.editable ? getAnimatedBoneNames(activeClip.editable) : []),
    [activeClip]
  );

  const syncLabelsScroll = useCallback((source: "main" | "labels") => {
    const main = scrollRef.current;
    const labels = labelsScrollRef.current;
    if (!main || !labels) return;
    if (source === "main") labels.scrollTop = main.scrollTop;
    else main.scrollTop = labels.scrollTop;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setTimelineViewportWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [setTimelineViewportWidth, activeClipId]);

  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      e.stopPropagation();
      const current = useAnimationStore.getState().timelineZoom;
      const factor = e.deltaY < 0 ? 1.22 : 1 / 1.22;
      useAnimationStore.getState().setTimelineZoom(zoomTimelineByFactor(current, factor));
    };

    const onGesture = (e: Event) => {
      e.preventDefault();
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("gesturestart", onGesture, { passive: false });
    root.addEventListener("gesturechange", onGesture, { passive: false });

    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("gesturestart", onGesture);
      root.removeEventListener("gesturechange", onGesture);
    };
  }, [activeClipId]);

  const handleSelectKeyframe = useCallback(
    (bone: string, time: number, mod: { ctrl: boolean; shift: boolean }) => {
      const ref = { bone, time };
      const times = activeClip?.editable ? getBoneKeyframeTimes(activeClip.editable, bone) : [];
      if (mod.shift) selection.selectRangeOnBone(ref, times);
      else if (mod.ctrl) selection.toggle(ref);
      else selection.selectOne(ref);
      pickBone(bone);
      seek(time);
    },
    [activeClip?.editable, pickBone, seek, selection]
  );

  const deleteSelected = useCallback(() => {
    if (!activeClip?.editable || selection.selectedRefs.length === 0) return;
    updateCustomClipData(activeClip.id, (data) =>
      deleteBoneKeyframes(
        data,
        selection.selectedRefs.map((r) => ({ boneName: r.bone, time: r.time }))
      )
    );
    selection.clear();
  }, [activeClip, selection, updateCustomClipData]);

  useEffect(() => {
    useAnimationStore.getState().setTimelineSelectedKeyframeCount(selection.count);
    return () => useAnimationStore.getState().setTimelineSelectedKeyframeCount(0);
  }, [selection.count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (!isEditable || selection.count === 0) return;
      e.preventDefault();
      deleteSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelected, isEditable, selection.count]);

  if (!activeClip) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-border bg-card">
        <Layers className="mb-2 h-8 w-8 text-foreground-muted/40" />
        <p className="max-w-xs px-4 text-center text-xs leading-relaxed text-foreground-muted">
          Select a clip from the Animation Library to edit keyframes, play ranges, and effects here.
        </p>
      </div>
    );
  }

  const primary = selection.primary;
  const selectedEasing =
    primary && activeClip.editable ? getPoseEasing(activeClip.editable, primary.bone, primary.time) : "linear";

  const onMarqueePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditable || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-keyframe]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x0 = e.clientX - rect.left;
    const y0 = e.clientY - rect.top;
    setMarquee({ x0, y0, x1: x0, y1: y0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMarqueePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!marquee) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMarquee({
      ...marquee,
      x1: e.clientX - rect.left,
      y1: e.clientY - rect.top,
    });
  };

  const onMarqueePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!marquee || !activeClip.editable) {
      setMarquee(null);
      return;
    }
    const xMin = Math.min(marquee.x0, marquee.x1);
    const xMax = Math.max(marquee.x0, marquee.x1);
    const yMin = Math.min(marquee.y0, marquee.y1);
    const yMax = Math.max(marquee.y0, marquee.y1);
    const refs: { bone: string; time: number }[] = [];
    animatedBones.forEach((bone, rowIndex) => {
      const rowTop = rowIndex * TIMELINE_ROW_HEIGHT;
      const rowBottom = rowTop + TIMELINE_ROW_HEIGHT;
      if (rowBottom < yMin || rowTop > yMax) return;
      const times = getBoneKeyframeTimes(activeClip.editable!, bone);
      times.forEach((t) => {
        const x = timeToPx(t, timelineZoom);
        if (x >= xMin && x <= xMax) refs.push({ bone, time: t });
      });
    });
    if (refs.length > 0) selection.selectMany(refs);
    else if (!e.shiftKey && !e.ctrlKey) selection.clear();
    setMarquee(null);
  };

  const tracksMinHeight = Math.max(animatedBones.length * TIMELINE_ROW_HEIGHT, 120);
  const totalContentHeight = TIMELINE_RULER_HEIGHT + tracksMinHeight;

  const snapMove = (t: number) => (snapToFrames ? snapTime(t, fps) : timeKey(t));

  return (
    <div
      ref={panelRef}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-gradient-to-b from-card/90 to-background shadow-inner"
    >
      <TimelineToolbar
        clipName={activeClip.name}
        isEditable={isEditable}
        fps={fps}
        selectedKeyframe={primary}
        currentEasing={selectedEasing}
        selectionCount={selection.count}
        snapToFrames={snapToFrames}
        onToggleSnap={() => setSnapToFrames((v) => !v)}
        onEditAsCustom={!isEditable ? () => duplicateClipAsCustom(activeClip) : undefined}
        onDeleteSelection={deleteSelected}
        onClearSelection={() => selection.clear()}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sticky label column */}
        <div className="flex flex-shrink-0 flex-col border-r border-border/40 bg-card/50" style={{ width: TIMELINE_LABEL_WIDTH }}>
          <div
            ref={labelsScrollRef}
            className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
            onScroll={() => syncLabelsScroll("labels")}
          >
            <div
              className="flex flex-shrink-0 items-end border-b border-border/30 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted"
              style={{ height: TIMELINE_RULER_HEIGHT }}
            >
              Tracks
            </div>
            {!isEditable && (
              <p className="p-2 text-[10px] leading-relaxed text-foreground-muted">Read-only — use Edit in toolbar.</p>
            )}
            {isEditable && animatedBones.length === 0 && (
              <p className="p-2 text-[10px] leading-relaxed text-foreground-muted">
                Pose bones and press K. Drag to box-select keyframes.
              </p>
            )}
            {animatedBones.map((bone, i) => (
              <TimelineTrackLabel
                key={bone}
                boneName={bone}
                isSelectedBone={selectedBoneSet.has(bone)}
                isAlternate={i % 2 === 1}
                onSelectBone={() => pickBone(bone)}
                onRemoveTrack={() => updateCustomClipData(activeClip.id, (d) => removeBoneTrack(d, bone))}
              />
            ))}
          </div>
        </div>

        {/* Single unified scroll — ruler + tracks share one horizontal scrollbar */}
        <div
          ref={scrollRef}
          className="custom-scrollbar relative min-h-0 min-w-0 flex-1 overflow-auto"
          onScroll={() => syncLabelsScroll("main")}
        >
          <div style={{ width: contentWidth, minHeight: totalContentHeight }} className="relative">
            <TimelinePlayRange
              duration={clipDuration}
              pixelsPerSecond={timelineZoom}
              height={totalContentHeight}
              editable={isEditable}
              scrollRef={scrollRef}
            />

            <TimelineGrid
              duration={clipDuration}
              contentWidth={contentWidth}
              pixelsPerSecond={timelineZoom}
              totalHeight={totalContentHeight}
              tracksTop={TIMELINE_RULER_HEIGHT}
              scrollRef={scrollRef}
              onScrub={seek}
            />

            <div
              className="relative z-[1]"
              style={{ minHeight: tracksMinHeight, marginTop: TIMELINE_RULER_HEIGHT }}
              onPointerDown={onMarqueePointerDown}
              onPointerMove={onMarqueePointerMove}
              onPointerUp={onMarqueePointerUp}
              onClick={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.trackCanvas) {
                  if (!e.shiftKey && !e.ctrlKey) selection.clear();
                  const scrollEl = scrollRef.current;
                  if (!scrollEl) return;
                  const rect = scrollEl.getBoundingClientRect();
                  const x = e.clientX - rect.left + scrollEl.scrollLeft;
                  seek(pxToTime(x, timelineZoom));
                }
              }}
            >
              {marquee && (
                <div
                  className="pointer-events-none absolute z-30 border border-primary/60 bg-primary/10"
                  style={{
                    left: Math.min(marquee.x0, marquee.x1),
                    top: Math.min(marquee.y0, marquee.y1),
                    width: Math.abs(marquee.x1 - marquee.x0),
                    height: Math.abs(marquee.y1 - marquee.y0),
                  }}
                />
              )}

              {animatedBones.map((bone, i) => (
                <TimelineTrackRow
                  key={bone}
                  boneName={bone}
                  isAlternate={i % 2 === 1}
                  times={activeClip.editable ? getBoneKeyframeTimes(activeClip.editable, bone) : []}
                  easings={activeClip.editable ? getBoneKeyframeEasings(activeClip.editable, bone) : new Map()}
                  duration={clipDuration}
                  contentWidth={contentWidth}
                  pixelsPerSecond={timelineZoom}
                  fps={fps}
                  snapToFrames={snapToFrames}
                  isKeyframeSelected={(t) => selection.isSelected({ bone, time: t })}
                  onSelectKeyframe={(time, mod) => handleSelectKeyframe(bone, time, mod)}
                  onMoveKeyframe={(oldTime, newTime) => {
                    if (!activeClip.editable) return;
                    const snapped = snapMove(newTime);
                    const selectedOnBone = selection.selectedRefs.filter((r) => r.bone === bone);
                    if (selectedOnBone.length > 1 && selection.isSelected({ bone, time: oldTime })) {
                      const delta = snapped - oldTime;
                      updateCustomClipData(activeClip.id, (data) =>
                        moveBoneKeyframes(
                          data,
                          selectedOnBone.map((r) => ({
                            boneName: r.bone,
                            oldTime: r.time,
                            newTime: timeKey(Math.max(0, Math.min(r.time + delta, clipDuration))),
                          }))
                        )
                      );
                      selection.selectMany(
                        selectedOnBone.map((r) => ({
                          bone: r.bone,
                          time: timeKey(Math.max(0, Math.min(r.time + delta, clipDuration))),
                        }))
                      );
                    } else {
                      updateCustomClipData(activeClip.id, (data) => moveBoneKeyframe(data, bone, oldTime, snapped));
                      selection.selectOne({ bone, time: snapped });
                    }
                  }}
                  onDeleteKeyframe={(time) => {
                    if (!activeClip.editable) return;
                    updateCustomClipData(activeClip.id, (data) => deleteBoneKeyframes(data, [{ boneName: bone, time }]));
                    if (selection.isSelected({ bone, time })) selection.clear();
                  }}
                />
              ))}
            </div>

            <TimelinePlayhead
              time={currentTime}
              duration={clipDuration}
              pixelsPerSecond={timelineZoom}
              height={totalContentHeight}
              scrollRef={scrollRef}
              onScrub={seek}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
