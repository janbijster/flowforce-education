import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  mastered: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ mastered, total, label, showPercentage = true }: ProgressBarProps) {
  const percentage = total > 0 ? (mastered / total) * 100 : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {label || `${mastered}/${total} topics mastered`}
        </span>
        {showPercentage && (
          <span className="text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

