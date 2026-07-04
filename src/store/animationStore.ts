import { create } from "zustand";
import type { ClipMeta, CustomClipData } from "@/types/model";
import type { RcanimPlaybackState } from "@/lib/rcanim-format";
import { buildClipFromData } from "@/lib/clip-builder";
import { clampTimelineZoom, fitTimelineZoom, TIMELINE_ZOOM_DEFAULT } from "@/lib/timeline-zoom";
import { useModelStore } from "@/store/modelStore";

export type TransformMode = "translate" | "rotate" | "scale";

interface HistoryEntry {
  clipId: string;
  data: CustomClipData;
}

interface AnimationState {
  clips: ClipMeta[];
  activeClipId: string | null;
  isPlaying: boolean;
  loop: boolean;
  loopInRange: boolean;
  playRangeStart: number;
  playRangeEnd: number;
  timelineZoom: number;
  timelineViewportWidth: number;
  timelineSelectedKeyframeCount: number;
  speed: number;
  currentTime: number;
  duration: number;
  transformMode: TransformMode;
  gizmoSpace: "local" | "world";
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  resetForNewModel: (clips: ClipMeta[]) => void;
  restoreProject: (clips: ClipMeta[], playback: RcanimPlaybackState) => void;
  addClip: (clip: ClipMeta, activate?: boolean) => void;
  removeClip: (id: string) => void;
  renameClip: (id: string, name: string) => void;
  setActiveClipId: (id: string | null) => void;
  updateCustomClipData: (id: string, updater: (data: CustomClipData) => CustomClipData, record?: boolean) => void;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stop: () => void;
  toggleLoop: () => void;
  toggleLoopInRange: () => void;
  setLoop: (loop: boolean) => void;
  setPlayRange: (start: number, end: number) => void;
  setPlayRangeStart: (time: number) => void;
  setPlayRangeEnd: (time: number) => void;
  resetPlayRange: () => void;
  setTimelineZoom: (pixelsPerSecond: number) => void;
  setTimelineViewportWidth: (width: number) => void;
  fitTimelineToView: () => void;
  setTimelineSelectedKeyframeCount: (count: number) => void;
  setSpeed: (speed: number) => void;
  seek: (time: number) => void;
  setCurrentTimeFromEngine: (time: number) => void;

  setTransformMode: (mode: TransformMode) => void;
  toggleGizmoSpace: () => void;
  stepFrame: (direction: -1 | 1) => void;
  undo: () => void;
  redo: () => void;
}

function applyActiveClipToEngine(clip: ClipMeta | undefined, loop: boolean) {
  const engine = useModelStore.getState().engine;
  if (!engine) return;
  engine.setClip(clip?.clip ?? null, loop);
}

export const useAnimationStore = create<AnimationState>((set, get) => ({
  clips: [],
  activeClipId: null,
  isPlaying: false,
  loop: true,
  loopInRange: true,
  playRangeStart: 0,
  playRangeEnd: 0,
  timelineZoom: TIMELINE_ZOOM_DEFAULT,
  timelineViewportWidth: 400,
  timelineSelectedKeyframeCount: 0,
  speed: 1,
  currentTime: 0,
  duration: 0,
  transformMode: "rotate",
  gizmoSpace: "local",
  undoStack: [],
  redoStack: [],

  resetForNewModel: (clips) => {
    const engine = useModelStore.getState().engine;
    engine?.setClip(null, true);
    set({
      clips,
      activeClipId: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playRangeStart: 0,
      playRangeEnd: 0,
      undoStack: [],
      redoStack: [],
    });
  },

  restoreProject: (clips, playback) => {
    const activeClip = clips.find((c) => c.id === playback.activeClipId) ?? clips[0];
    const activeId = activeClip?.id ?? null;
    applyActiveClipToEngine(activeClip, playback.loop);

    const engine = useModelStore.getState().engine;
    if (engine) {
      engine.setSpeed(playback.speed);
      if (activeClip) engine.seek(playback.currentTime);
    }

    set({
      clips,
      activeClipId: activeId,
      isPlaying: false,
      loop: playback.loop,
      loopInRange: playback.loopInRange,
      playRangeStart: playback.playRangeStart,
      playRangeEnd: playback.playRangeEnd,
      speed: playback.speed,
      currentTime: activeClip ? playback.currentTime : 0,
      duration: activeClip?.duration ?? 0,
      undoStack: [],
      redoStack: [],
    });
  },

  addClip: (clip, activate) => {
    set((s) => ({ clips: [...s.clips, clip] }));
    if (activate) get().setActiveClipId(clip.id);
  },

  removeClip: (id) => {
    set((s) => ({
      clips: s.clips.filter((c) => c.id !== id),
      activeClipId: s.activeClipId === id ? null : s.activeClipId,
      undoStack: s.undoStack.filter((h) => h.clipId !== id),
      redoStack: s.redoStack.filter((h) => h.clipId !== id),
    }));
    if (get().activeClipId === null) applyActiveClipToEngine(undefined, get().loop);
  },

  renameClip: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => ({
      clips: s.clips.map((c) => {
        if (c.id !== id) return c;
        if (c.source === "custom" && c.editable) {
          const editable = { ...c.editable, name: trimmed };
          return { ...c, name: trimmed, editable, clip: buildClipFromData(editable) };
        }
        c.clip.name = trimmed;
        return { ...c, name: trimmed, clip: c.clip };
      }),
    }));
  },

  setActiveClipId: (id) => {
    const clip = get().clips.find((c) => c.id === id);
    const dur = clip?.duration ?? 0;
    applyActiveClipToEngine(clip, get().loop);
    set({
      activeClipId: id,
      isPlaying: false,
      currentTime: 0,
      duration: dur,
      playRangeStart: 0,
      playRangeEnd: dur,
    });
  },

  updateCustomClipData: (id, updater, record = true) => {
    const state = get();
    const target = state.clips.find((c) => c.id === id && c.source === "custom");
    if (!target || !target.editable) return;

    const before = target.editable;
    const nextData = updater(before);
    const nextClip = buildClipFromData(nextData);

    const engine = useModelStore.getState().engine;
    const wasActive = state.activeClipId === id;
    const preservedTime = engine?.time ?? 0;

    set((s) => ({
      clips: s.clips.map((c) => (c.id === id ? { ...c, editable: nextData, clip: nextClip, duration: nextData.duration, name: nextData.name } : c)),
      undoStack: record ? [...s.undoStack, { clipId: id, data: before }].slice(-50) : s.undoStack,
      redoStack: record ? [] : s.redoStack,
      duration: wasActive ? nextData.duration : s.duration,
      playRangeEnd: wasActive ? Math.min(s.playRangeEnd || nextData.duration, nextData.duration) : s.playRangeEnd,
    }));

    if (wasActive && engine) {
      engine.setClip(nextClip, get().loop);
      engine.seek(preservedTime);
    }
  },

  play: () => {
    const { playRangeStart, playRangeEnd, currentTime, duration, seek } = get();
    const end = playRangeEnd > 0 ? playRangeEnd : duration;
    if (currentTime < playRangeStart || currentTime >= end - 0.0001) {
      seek(playRangeStart);
    }
    useModelStore.getState().engine?.play();
    set({ isPlaying: true });
  },
  pause: () => {
    useModelStore.getState().engine?.pause();
    set({ isPlaying: false });
  },
  togglePlay: () => (get().isPlaying ? get().pause() : get().play()),
  stop: () => {
    const engine = useModelStore.getState().engine;
    const start = get().playRangeStart;
    engine?.pause();
    engine?.seek(start);
    set({ isPlaying: false, currentTime: start });
  },
  toggleLoop: () => {
    const loop = !get().loop;
    useModelStore.getState().engine?.setLoop(loop);
    set({ loop });
  },
  toggleLoopInRange: () => set((s) => ({ loopInRange: !s.loopInRange })),
  setLoop: (loop) => {
    useModelStore.getState().engine?.setLoop(loop);
    set({ loop });
  },
  setPlayRange: (start, end) => {
    const duration = get().duration;
    const a = Math.max(0, Math.min(start, duration));
    const b = Math.max(a + 0.05, Math.min(end, duration));
    set({ playRangeStart: a, playRangeEnd: b });
  },
  setPlayRangeStart: (time) => {
    const { duration, playRangeEnd } = get();
    const start = Math.max(0, Math.min(time, (playRangeEnd || duration) - 0.05));
    set({ playRangeStart: start });
  },
  setPlayRangeEnd: (time) => {
    const { playRangeStart, duration } = get();
    const end = Math.max(playRangeStart + 0.05, Math.min(time, duration));
    set({ playRangeEnd: end });
  },
  resetPlayRange: () => {
    const duration = get().duration;
    set({ playRangeStart: 0, playRangeEnd: duration });
  },
  setTimelineZoom: (pixelsPerSecond) => {
    set({ timelineZoom: clampTimelineZoom(pixelsPerSecond) });
  },
  setTimelineViewportWidth: (width) => set({ timelineViewportWidth: Math.max(0, width) }),
  fitTimelineToView: () => {
    const { duration, timelineViewportWidth } = get();
    get().setTimelineZoom(fitTimelineZoom(duration, timelineViewportWidth));
  },
  setTimelineSelectedKeyframeCount: (count) => set({ timelineSelectedKeyframeCount: count }),
  setSpeed: (speed) => {
    useModelStore.getState().engine?.setSpeed(speed);
    set({ speed });
  },
  seek: (time) => {
    useModelStore.getState().engine?.seek(time);
    set({ currentTime: time });
  },
  setCurrentTimeFromEngine: (time) => set({ currentTime: time }),

  setTransformMode: (mode) => set({ transformMode: mode }),

  toggleGizmoSpace: () => set((s) => ({ gizmoSpace: s.gizmoSpace === "local" ? "world" : "local" })),

  stepFrame: (direction) => {
    const { activeClipId, clips, currentTime, duration, seek } = get();
    const clip = clips.find((c) => c.id === activeClipId);
    const fps = clip?.editable?.fps ?? 30;
    const step = 1 / fps;
    const next = Math.max(0, Math.min(duration || clip?.duration || 0, currentTime + direction * step));
    seek(next);
  },

  undo: () => {
    const { undoStack } = get();
    const entry = undoStack[undoStack.length - 1];
    if (!entry) return;
    const target = get().clips.find((c) => c.id === entry.clipId);
    if (!target?.editable) return;
    const redoEntry: HistoryEntry = { clipId: entry.clipId, data: target.editable };
    get().updateCustomClipData(entry.clipId, () => entry.data, false);
    set((s) => ({ undoStack: s.undoStack.slice(0, -1), redoStack: [...s.redoStack, redoEntry] }));
  },

  redo: () => {
    const { redoStack } = get();
    const entry = redoStack[redoStack.length - 1];
    if (!entry) return;
    const target = get().clips.find((c) => c.id === entry.clipId);
    if (!target?.editable) return;
    const undoEntry: HistoryEntry = { clipId: entry.clipId, data: target.editable };
    get().updateCustomClipData(entry.clipId, () => entry.data, false);
    set((s) => ({ redoStack: s.redoStack.slice(0, -1), undoStack: [...s.undoStack, undoEntry] }));
  },
}));
