import { Activity, ActiveTimer } from '@/lib/types';
import { formatDurationHHMMSS, formatTimeWithSeconds } from '@/lib/timeUtils';
import { Play, Square, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  activity: Activity;
  activeTimer: ActiveTimer | null;
  elapsedTime: number;
  onStart: (activityId: string) => void;
  onStop: () => void;
}

export function ActivityCard({ 
  activity, 
  activeTimer, 
  elapsedTime,
  onStart, 
  onStop 
}: ActivityCardProps) {
  const isActive = activeTimer?.activityId === activity.id;
  
  return (
    <div 
      className={cn(
        "relative p-4 rounded-xl transition-all duration-300 cursor-pointer group",
        "border-2 shadow-card hover:shadow-lg",
        isActive 
          ? "border-primary bg-primary/5 animate-timer" 
          : "border-transparent bg-card hover:border-primary/30"
      )}
      onClick={() => isActive ? onStop() : onStart(activity.id)}
    >
      {/* Color indicator */}
      <div 
        className="absolute top-3 right-3 w-3 h-3 rounded-full"
        style={{ backgroundColor: activity.color }}
      />
      
      {/* Activity name */}
      <h3 className="font-semibold text-foreground mb-2 pr-6">{activity.name}</h3>
      
      {/* Timer or action button */}
      {isActive ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-xs text-muted-foreground">
              Started {formatTimeWithSeconds(activeTimer.startTime)}
            </span>
          </div>
          <div className="text-2xl font-bold text-primary font-mono">
            {formatDurationHHMMSS(elapsedTime)}
          </div>
          <button 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium transition-colors hover:bg-destructive/90"
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
          >
            <Square className="w-3 h-3" />
            Stop
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
          <Play className="w-4 h-4" />
          <span className="text-sm">Click to start</span>
        </div>
      )}
    </div>
  );
}
