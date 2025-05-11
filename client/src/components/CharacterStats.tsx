import { CharacterStat } from "../types";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CharacterStatsProps {
  stats: CharacterStat[];
}

export function CharacterStats({ stats }: CharacterStatsProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return "bg-destructive";
    if (percentage > 80) return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <div className="mt-6">
      <h3 className="text-md font-medium mb-3">Character Stats</h3>
      <div className="stats stats-vertical shadow w-full bg-card text-card-foreground">
        {stats.map((stat) => (
          <div key={stat.platform} className="stat p-3">
            <div className="stat-title capitalize">{stat.platform}</div>
            <div className="stat-value text-lg">
              <span>{stat.current}</span>
              <span className="text-muted-foreground text-sm">/{stat.limit}</span>
            </div>
            <div className="stat-desc mt-1">
              <Progress 
                value={stat.percentage} 
                max={100} 
                className="h-2"
                indicatorClassName={getProgressColor(stat.percentage)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
