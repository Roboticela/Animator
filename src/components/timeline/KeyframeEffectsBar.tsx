import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  CircleDot,
  CornerDownLeft,
  CornerDownRight,
  Minus,
  Moon,
  Pause,
  Sparkles,
  Sun,
  Waves,
} from "lucide-react";
import { FeedbackButton } from "@/components/ui/FeedbackButton";
import { cn } from "@/lib/utils";
import type { KeyframeEasingId } from "@/lib/keyframe-easing";
import { KEYFRAME_EASINGS } from "@/lib/keyframe-easing";
import { setBoneKeyframeEasing, setEasingForAllBonesAtTime } from "@/lib/app-actions";

const KEYFRAME_EASING_ICONS: Record<KeyframeEasingId, LucideIcon> = {
  linear: Minus,
  easeIn: Sun,
  easeOut: Moon,
  easeInOut: ArrowLeftRight,
  hold: Pause,
  easeInBack: CornerDownLeft,
  easeOutBack: CornerDownRight,
  bounce: CircleDot,
  elastic: Waves,
};

interface KeyframeEffectsBarProps {
  selectedKeyframe: { bone: string; time: number } | null;
  currentEasing: KeyframeEasingId;
  hasNextKeyframe: boolean;
}

export function KeyframeEffectsBar({ selectedKeyframe, currentEasing, hasNextKeyframe }: KeyframeEffectsBarProps) {
  const [applyToAll, setApplyToAll] = useState(false);
  const enabled = selectedKeyframe !== null;

  const apply = (easing: KeyframeEasingId) => {
    if (!selectedKeyframe) return false;
    if (applyToAll) return setEasingForAllBonesAtTime(selectedKeyframe.time, easing);
    return setBoneKeyframeEasing(selectedKeyframe.bone, selectedKeyframe.time, easing);
  };

  return (
    <div className="flex flex-shrink-0 flex-col gap-1 border-b border-border/60 bg-background-subtle/80 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] text-foreground-muted">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
          <span className="truncate font-medium text-foreground">Keyframe effects</span>
          {enabled ? (
            <span className="truncate text-foreground-muted">
              — {selectedKeyframe.bone} @ {selectedKeyframe.time.toFixed(2)}s
            </span>
          ) : (
            <span className="truncate italic text-foreground-muted/80">— select a keyframe</span>
          )}
        </div>

        <label
          className={cn(
            "flex flex-shrink-0 items-center gap-1.5 text-[10px] text-foreground-muted",
            enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"
          )}
        >
          <input
            type="checkbox"
            checked={applyToAll}
            disabled={!enabled}
            onChange={(e) => setApplyToAll(e.target.checked)}
            className="rounded border-border"
          />
          All bones
        </label>
      </div>

      {enabled && !hasNextKeyframe && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          Add another keyframe to preview the outgoing segment.
        </p>
      )}

      <div className="custom-scrollbar flex gap-1 overflow-x-auto pb-0.5">
        {KEYFRAME_EASINGS.map((def) => {
          const Icon = KEYFRAME_EASING_ICONS[def.id];
          const active = enabled && currentEasing === def.id;
          return (
            <FeedbackButton
              key={def.id}
              variant={active ? "default" : "outline"}
              size="icon"
              disabled={!enabled}
              title={enabled ? `${def.name} — ${def.description}` : `${def.name} — select a keyframe first`}
              className={cn("h-8 w-8 flex-shrink-0", active && "ring-1 ring-primary/40")}
              onPress={() => apply(def.id)}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              <span className="sr-only">{def.name}</span>
            </FeedbackButton>
          );
        })}
      </div>
    </div>
  );
}
