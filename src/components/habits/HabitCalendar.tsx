import { Habit, HabitLog } from '@/lib/types';
import { isHabitScheduledForDate } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface HabitCalendarProps {
  habit: Habit;
  logs: HabitLog[];
  month?: Date;
}

export function HabitCalendar({ habit, logs, month = new Date() }: HabitCalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  
  // Get first day of month and number of days
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();
  
  // Generate calendar days
  const days: (number | null)[] = [];
  
  // Empty cells before first day
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  
  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  const getDateString = (day: number): string => {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  
  const getDayStatus = (day: number): 'done' | 'missed' | 'scheduled' | 'not-scheduled' | 'future' => {
    const dateStr = getDateString(day);
    const today = new Date();
    const date = new Date(dateStr);
    
    // Future dates
    if (date > today) return 'future';
    
    // Check if scheduled
    const isScheduled = isHabitScheduledForDate(habit, dateStr);
    if (!isScheduled) return 'not-scheduled';
    
    // Check log
    const log = logs.find(l => l.date === dateStr);
    if (log?.completed) return 'done';
    
    // If today and not completed, show as scheduled
    if (date.toDateString() === today.toDateString()) return 'scheduled';
    
    // Past scheduled day without completion
    return 'missed';
  };

  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="text-center text-sm font-medium text-foreground mb-3">
        {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) {
            return <div key={i} className="aspect-square" />;
          }
          
          const status = getDayStatus(day);
          
          return (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors",
                status === 'done' && "bg-habit-done text-white",
                status === 'missed' && "bg-habit-missed/20 text-habit-missed",
                status === 'scheduled' && "bg-habit-pending/20 text-habit-pending border border-habit-pending",
                status === 'not-scheduled' && "text-muted-foreground/50",
                status === 'future' && "text-muted-foreground/30"
              )}
            >
              {day}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex gap-3 justify-center mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-habit-done" />
          <span className="text-muted-foreground">Done</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-habit-missed/20 border border-habit-missed/50" />
          <span className="text-muted-foreground">Missed</span>
        </div>
      </div>
    </div>
  );
}
