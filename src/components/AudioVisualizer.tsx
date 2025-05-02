
import { cn } from "@/lib/utils";

export function AudioVisualizer({ isActive = false }: { isActive?: boolean }) {
  return (
    <div className="visualizer-container">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn(
            "visualizer-bar h-5",
            isActive
              ? `animate-wave-${i} text-assistant-primary`
              : "h-1 text-muted-foreground"
          )}
        />
      ))}
    </div>
  );
}
