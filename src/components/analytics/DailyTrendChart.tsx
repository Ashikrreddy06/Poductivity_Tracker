import { DailySummary } from '@/lib/types';
import { formatDurationHHMMSS, formatDateShort, MS_PER_DAY } from '@/lib/timeUtils';

interface DailyTrendChartProps {
  summaries: DailySummary[];
}

export function DailyTrendChart({ summaries }: DailyTrendChartProps) {
  if (summaries.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No data for this period
      </div>
    );
  }

  const maxDuration = Math.max(...summaries.map(s => s.totalDurationMs), MS_PER_DAY * 0.5);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-1 h-40">
        {summaries.map((summary, i) => {
          const height = (summary.totalDurationMs / maxDuration) * 100;
          return (
            <div 
              key={summary.date} 
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="text-xs text-muted-foreground font-mono rotate-0">
                {formatDurationHHMMSS(summary.totalDurationMs).split(':').slice(0, 2).join(':')}
              </div>
              <div 
                className="w-full rounded-t-md gradient-primary transition-all duration-300 hover:opacity-80"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              <div className="text-xs text-muted-foreground truncate w-full text-center">
                {formatDateShort(summary.date)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
