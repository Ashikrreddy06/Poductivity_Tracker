import { ActivitySummary } from '@/lib/types';
import { formatDurationHHMMSS, calculatePercentage, MS_PER_DAY } from '@/lib/timeUtils';

interface ActivityChartProps {
  summaries: ActivitySummary[];
  totalMs: number;
  showPercentOfDay?: boolean;
}

export function ActivityChart({ summaries, totalMs, showPercentOfDay = true }: ActivityChartProps) {
  if (summaries.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No time tracked yet
      </div>
    );
  }

  const maxDuration = Math.max(...summaries.map(s => s.totalDurationMs));

  return (
    <div className="space-y-4">
      {/* Total summary */}
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">Total tracked</span>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground font-mono">
            {formatDurationHHMMSS(totalMs)}
          </span>
          {showPercentOfDay && (
            <span className="text-sm text-muted-foreground ml-2">
              ({calculatePercentage(totalMs, MS_PER_DAY)}% of day)
            </span>
          )}
        </div>
      </div>

      {/* Activity bars */}
      <div className="space-y-3">
        {summaries.map(summary => (
          <div key={summary.activityId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: summary.color }}
                />
                <span className="font-medium text-foreground">{summary.activityName}</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-foreground">
                  {formatDurationHHMMSS(summary.totalDurationMs)}
                </span>
                <span className="text-muted-foreground ml-2">
                  ({summary.percentage}%)
                </span>
              </div>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(summary.totalDurationMs / maxDuration) * 100}%`,
                  backgroundColor: summary.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
