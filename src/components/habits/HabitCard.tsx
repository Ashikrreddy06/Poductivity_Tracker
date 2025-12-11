import { Habit, HabitLog, HabitStats } from '@/lib/types';
import { formatDurationHHMMSS } from '@/lib/timeUtils';
import { Check, Flame, Plus, Minus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitCardProps {
  habit: Habit;
  log: HabitLog | undefined;
  stats: HabitStats;
  autoProgress?: number; // seconds from time tracker
  onToggleComplete: () => void;
  onAddProgress: (value: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitCard({ 
  habit, 
  log, 
  stats, 
  autoProgress = 0,
  onToggleComplete, 
  onAddProgress,
  onEdit,
  onDelete
}: HabitCardProps) {
  const isCompleted = log?.completed || false;
  const progress = log?.progressValue || 0;
  
  // For time-based habits, combine manual progress with auto progress
  const totalProgressSeconds = habit.type === 'time' 
    ? progress + autoProgress 
    : progress;
  
  const targetSeconds = habit.type === 'time' ? habit.targetMinutes * 60 : habit.targetCount;
  const progressPercent = habit.type !== 'binary' 
    ? Math.min(100, (totalProgressSeconds / targetSeconds) * 100) 
    : isCompleted ? 100 : 0;

  // Auto-complete for time/count habits when target is reached
  const isAutoCompleted = habit.type !== 'binary' && totalProgressSeconds >= targetSeconds;

  return (
    <div 
      className={cn(
        "p-4 rounded-xl border-2 transition-all group",
        (isCompleted || isAutoCompleted)
          ? "bg-habit-done/10 border-habit-done"
          : "bg-card border-transparent hover:border-border"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox / Status */}
        {habit.type === 'binary' ? (
          <button
            onClick={onToggleComplete}
            className={cn(
              "w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors",
              isCompleted 
                ? "bg-habit-done border-habit-done text-white" 
                : "border-border hover:border-primary"
            )}
          >
            {isCompleted && <Check className="w-4 h-4" />}
          </button>
        ) : (
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: habit.color }}
          >
            {(isCompleted || isAutoCompleted) ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <span className="text-xs font-bold text-white">
                {Math.round(progressPercent)}%
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "font-medium truncate",
              (isCompleted || isAutoCompleted) ? "text-muted-foreground line-through" : "text-foreground"
            )}>
              {habit.name}
            </h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {habit.category}
            </span>
          </div>

          {/* Progress for time/count habits */}
          {habit.type !== 'binary' && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground font-mono">
                  {habit.type === 'time' 
                    ? formatDurationHHMMSS(totalProgressSeconds * 1000)
                    : totalProgressSeconds
                  }
                  {' / '}
                  {habit.type === 'time' 
                    ? formatDurationHHMMSS(targetSeconds * 1000)
                    : targetSeconds
                  }
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progressPercent}%`,
                    backgroundColor: habit.color 
                  }}
                />
              </div>
              
              {/* Quick add buttons */}
              <div className="flex gap-2 mt-2">
                {habit.type === 'time' ? (
                  <>
                    <button
                      onClick={() => onAddProgress(5 * 60)}
                      className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                    >
                      +5m
                    </button>
                    <button
                      onClick={() => onAddProgress(15 * 60)}
                      className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                    >
                      +15m
                    </button>
                    <button
                      onClick={() => onAddProgress(30 * 60)}
                      className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                    >
                      +30m
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onAddProgress(-1)}
                      disabled={progress <= 0}
                      className="p-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onAddProgress(1)}
                      className="p-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Streak */}
        {stats.currentStreak > 0 && (
          <div className="flex items-center gap-1 text-accent">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-semibold">{stats.currentStreak}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-muted">
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-destructive/10">
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}
