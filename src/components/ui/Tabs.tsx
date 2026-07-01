import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: RadixTabs.TabsListProps) {
  return (
    <RadixTabs.List
      className={cn("flex flex-shrink-0 items-center gap-1 border-b border-border px-2 sm:px-3", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: RadixTabs.TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "relative px-2.5 py-2.5 text-xs font-medium text-foreground/50 transition-colors hover:text-foreground sm:px-3",
        "data-[state=active]:text-primary",
        "after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent data-[state=active]:after:bg-primary",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: RadixTabs.TabsContentProps) {
  return <RadixTabs.Content className={cn("min-h-0 flex-1 outline-none", className)} {...props} />;
}
