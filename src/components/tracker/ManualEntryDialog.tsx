import { useState, useEffect } from 'react';
import { TimeEntry, Activity } from '@/lib/types';
import { getDateString, parseTimeInputToTimestamp } from '@/lib/timeUtils';
import { addTimeEntry, updateTimeEntry } from '@/lib/storage';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface ManualEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  editEntry?: TimeEntry | null;
  selectedDate: string;
  onSave: () => void;
}

export function ManualEntryDialog({ 
  isOpen, 
  onClose, 
  activities, 
  editEntry,
  selectedDate,
  onSave 
}: ManualEntryDialogProps) {
  const [activityId, setActivityId] = useState('');
  const [date, setDate] = useState(selectedDate);
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [startSecond, setStartSecond] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [endSecond, setEndSecond] = useState('00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editEntry) {
      setActivityId(editEntry.activityId);
      setDate(editEntry.date);
      
      const start = new Date(editEntry.startTime);
      setStartHour(String(start.getHours()).padStart(2, '0'));
      setStartMinute(String(start.getMinutes()).padStart(2, '0'));
      setStartSecond(String(start.getSeconds()).padStart(2, '0'));
      
      const end = new Date(editEntry.endTime);
      setEndHour(String(end.getHours()).padStart(2, '0'));
      setEndMinute(String(end.getMinutes()).padStart(2, '0'));
      setEndSecond(String(end.getSeconds()).padStart(2, '0'));
      
      setNotes(editEntry.notes);
    } else {
      setActivityId(activities[0]?.id || '');
      setDate(selectedDate);
      const now = new Date();
      setStartHour(String(now.getHours()).padStart(2, '0'));
      setStartMinute(String(now.getMinutes()).padStart(2, '0'));
      setStartSecond('00');
      setEndHour(String(now.getHours()).padStart(2, '0'));
      setEndMinute(String(now.getMinutes()).padStart(2, '0'));
      setEndSecond('00');
      setNotes('');
    }
    setError('');
  }, [editEntry, activities, selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activityId) {
      setError('Please select an activity');
      return;
    }

    const dateObj = new Date(date);
    const startTime = parseTimeInputToTimestamp(
      parseInt(startHour), parseInt(startMinute), parseInt(startSecond), dateObj
    );
    const endTime = parseTimeInputToTimestamp(
      parseInt(endHour), parseInt(endMinute), parseInt(endSecond), dateObj
    );

    if (endTime <= startTime) {
      setError('End time must be after start time');
      return;
    }

    const durationMs = endTime - startTime;
    const entry = {
      activityId,
      startTime,
      endTime,
      durationMs,
      date,
      notes,
    };

    if (editEntry) {
      updateTimeEntry(editEntry.id, entry);
      toast.success('Entry updated');
    } else {
      addTimeEntry(entry);
      toast.success('Entry added');
    }

    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg border border-border animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {editEntry ? 'Edit Time Entry' : 'Add Manual Entry'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Activity select */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Activity</label>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {activities.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Start time */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Start Time (HH:MM:SS)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="23"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value.padStart(2, '0'))}
                className="w-16 px-2 py-2 rounded-lg bg-background border border-input text-foreground text-center font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-foreground self-center">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={startMinute}
                onChange={(e) => setStartMinute(e.target.value.padStart(2, '0'))}
                className="w-16 px-2 py-2 rounded-lg bg-background border border-input text-foreground text-center font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-foreground self-center">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={startSecond}
                onChange={(e) => setStartSecond(e.target.value.padStart(2, '0'))}
                className="w-16 px-2 py-2 rounded-lg bg-background border border-input text-foreground text-center font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* End time */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">End Time (HH:MM:SS)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="23"
                value={endHour}
                onChange={(e) => setEndHour(e.target.value.padStart(2, '0'))}
                className="w-16 px-2 py-2 rounded-lg bg-background border border-input text-foreground text-center font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-foreground self-center">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={endMinute}
                onChange={(e) => setEndMinute(e.target.value.padStart(2, '0'))}
                className="w-16 px-2 py-2 rounded-lg bg-background border border-input text-foreground text-center font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-foreground self-center">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={endSecond}
                onChange={(e) => setEndSecond(e.target.value.padStart(2, '0'))}
                className="w-16 px-2 py-2 rounded-lg bg-background border border-input text-foreground text-center font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Add notes..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              {editEntry ? 'Update' : 'Add Entry'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
