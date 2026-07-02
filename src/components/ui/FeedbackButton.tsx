import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FeedbackButtonProps extends ButtonProps {
  /** Called on click; return false to skip the checkmark (e.g. action failed). */
  onPress?: (event: React.MouseEvent<HTMLButtonElement>) => void | boolean | Promise<void | boolean>;
  feedbackDurationMs?: number;
  children: ReactNode;
}

export function FeedbackButton({
  children,
  onPress,
  onClick,
  feedbackDurationMs = 520,
  disabled,
  className,
  ...props
}: FeedbackButtonProps) {
  const [showCheck, setShowCheck] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onClick?.(event);

      let ok = true;
      if (onPress) {
        const result = await onPress(event);
        if (result === false) ok = false;
      }

      if (!ok) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      setShowCheck(true);
      timerRef.current = setTimeout(() => setShowCheck(false), feedbackDurationMs);
    },
    [disabled, onClick, onPress, feedbackDurationMs]
  );

  return (
    <Button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      className={cn(className, showCheck && "bg-success/15 ring-1 ring-success/40")}
    >
      <span
        className={cn(
          "flex items-center justify-center transition-transform duration-150",
          showCheck && "scale-110"
        )}
      >
        {showCheck ? <Check className="h-4 w-4 text-success" strokeWidth={2.75} /> : children}
      </span>
    </Button>
  );
}
