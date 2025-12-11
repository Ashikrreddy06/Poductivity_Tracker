import { TimePeriodBreakdown, ActivitySummary } from '@/lib/types';
import { formatDurationHHMMSS } from '@/lib/timeUtils';
import { Sun, Sunset, Moon, CloudMoon } from 'lucide-react';

interface TimePeriodChartProps {
  breakdown: TimePeriodBreakdown;
}

const periodInfo = {
  morning: { label: 'Morning', time: '5 AM - 12 PM', icon: Sun, color: 'text-habit-pending' },
  afternoon: { label: 'Afternoon', time: '12 PM - 5 PM', icon: Sunset, color: 'text-accent' },
  evening: { label: 'Evening', time: '5 PM - 10 PM', icon: Moon, color: 'text-activity-work' },
  night: { label: 'Night', time: '10 PM - 5 AM', icon: CloudMoon, color: 'text-activity-sleep' },
};

export function TimePeriodChart({ breakdown }: TimePeriodChartProps) {
  const periods = ['morning', 'afternoon', 'evening', 'night'] as const;

  return (
    <div className="grid grid-cols-2 gap-4">
      {periods.map(period => {
        const info = periodInfo[period];
        const activities = breakdown[period];
        const totalMs = activities.reduce((sum, a) => sum + a.totalDurationMs, 0);
        const Icon = info.icon;

        return (
          <div key={period} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-5 h-5 ${info.color}`} />
              <div>
                <h4 className="font-medium text-foreground">{info.label}</h4>
                <p className="text-xs text-muted-foreground">{info.time}</p>
              </div>
            </div>
            
            <div className="text-lg font-bold font-mono text-foreground mb-2">
              {formatDurationHHMMSS(totalMs)}
            </div>

            {activities.length > 0 ? (
              <div className="space-y-1">
                {activities.slice(0, 3).map(activity => (
                  <div key={activity.activityId} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: activity.color }}
                    />
                    <span className="text-muted-foreground truncate">{activity.activityName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
