import { useState } from "react";
import { Sparkles } from "lucide-react";
import { FeedbackButton } from "@/components/ui/FeedbackButton";
import { cn } from "@/lib/utils";
import type { KeyframeEasingId } from "@/lib/keyframe-easing";
import { KEYFRAME_EASINGS } from "@/lib/keyframe-easing";
import { setBoneKeyframeEasing, setEasingForAllBonesAtTime } from "@/lib/app-actions";

interface KeyframeEffectsBarProps {
  boneName: string;
  time: number;
  currentEasing: KeyframeEasingId;
  hasNextKeyframe: boolean;
}

export function KeyframeEffectsBar({ boneName, time, currentEasing, hasNextKeyframe }: KeyframeEffectsBarProps) {
  const [applyToAll, setApplyToAll] = useState(false);

  const apply = (easing: KeyframeEasingId) => {
    if (applyToAll) return setEasingForAllBonesAtTime(time, easing);
    return setBoneKeyframeEasing(boneName, time, easing);
  };

  return (
    <div className="flex flex-shrink-0 flex-col gap-1.5 border-b border-border/60 bg-background-subtle/80 px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-foreground-muted">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
          <span className="truncate">
            Outgoing effect — <span className="font-semibold text-foreground">{boneName}</span> @ {time.toFixed(2)}s
          </span>
        </div>
        <label className="flex flex-shrink-0 cursor-pointer items-center gap-1.5 text-[10px] text-foreground-muted">
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            className="rounded border-border"
          />
          All bones at this time
        </label>
      </div>

      {!hasNextKeyframe && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          Effect applies to the segment toward the next keyframe — add one to see the motion.
        </p>
      )}

      <div className="custom-scrollbar flex flex-wrap gap-1 pb-0.5">
        {KEYFRAME_EASINGS.map((def) => (
          <FeedbackButton
            key={def.id}
            variant={currentEasing === def.id ? "default" : "outline"}
            size="xs"
            title={def.description}
            className={cn("text-[10px]", currentEasing === def.id && "ring-1 ring-primary/40")}
            onPress={() => apply(def.id)}
          >
            {def.name}
          </FeedbackButton>
        ))}
      </div>
    </div>
  );
}
