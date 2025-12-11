import { TimeEntry, Activity } from '@/lib/types';
import { formatTime24h, formatDurationHHMMSS } from '@/lib/timeUtils';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeEntryCardProps {
  entry: TimeEntry;
  activity: Activity | undefined;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (id: string) => void;
}

export function TimeEntryCard({ entry, activity, onEdit, onDelete }: TimeEntryCardProps) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border hover:shadow-card transition-shadow group">
      {/* Color bar */}
      <div 
        className="w-1 h-12 rounded-full flex-shrink-0"
        style={{ backgroundColor: activity?.color || '#888' }}
      />
      
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">
            {activity?.name || 'Unknown Activity'}
          </span>
          {entry.notes && (
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              — {entry.notes}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="font-mono">
            {formatTime24h(entry.startTime)} – {formatTime24h(entry.endTime)}
          </span>
        </div>
      </div>
      
      {/* Duration */}
      <div className="text-right flex-shrink-0">
        <div className="font-semibold text-foreground font-mono">
          {formatDurationHHMMSS(entry.durationMs)}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEdit(entry)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Edit entry"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
        <button 
          onClick={() => onDelete(entry.id)}
          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
          title="Delete entry"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>
    </div>
  );
}
