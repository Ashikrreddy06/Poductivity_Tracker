import { useState, useEffect } from 'react';
import { Habit, Activity, HABIT_CATEGORIES, DEFAULT_COLORS, DAYS_OF_WEEK } from '@/lib/types';
import { addHabit, updateHabit, loadActivities } from '@/lib/storage';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HabitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editHabit?: Habit | null;
  onSave: () => void;
}

export function HabitDialog({ isOpen, onClose, editHabit, onSave }: HabitDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'binary' | 'time' | 'count'>('binary');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'daysOfWeek' | 'timesPerWeek'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [targetCount, setTargetCount] = useState(1);
  const [category, setCategory] = useState('Health');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [linkedActivityId, setLinkedActivityId] = useState<string>('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setActivities(loadActivities());
  }, [isOpen]);

  useEffect(() => {
    if (editHabit) {
      setName(editHabit.name);
      setType(editHabit.type);
      setFrequencyType(editHabit.frequencyType);
      if (editHabit.frequencyType === 'daysOfWeek') {
        setSelectedDays(editHabit.frequencyData);
      } else if (editHabit.frequencyType === 'timesPerWeek') {
        setTimesPerWeek(editHabit.frequencyData[0] || 3);
      }
      setTargetMinutes(editHabit.targetMinutes);
      setTargetCount(editHabit.targetCount);
      setCategory(editHabit.category);
      setColor(editHabit.color);
      setLinkedActivityId(editHabit.linkedActivityId || '');
    } else {
      setName('');
      setType('binary');
      setFrequencyType('daily');
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setTimesPerWeek(3);
      setTargetMinutes(30);
      setTargetCount(1);
      setCategory('Health');
      setColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
      setLinkedActivityId('');
    }
    setError('');
  }, [editHabit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    let frequencyData: number[] = [];
    if (frequencyType === 'daily') {
      frequencyData = [];
    } else if (frequencyType === 'daysOfWeek') {
      if (selectedDays.length === 0) {
        setError('Select at least one day');
        return;
      }
      frequencyData = selectedDays;
    } else {
      frequencyData = [timesPerWeek];
    }

    const habitData = {
      name: name.trim(),
      type,
      frequencyType,
      frequencyData,
      targetMinutes: type === 'time' ? targetMinutes : 0,
      targetCount: type === 'count' ? targetCount : 0,
      category,
      color,
      linkedActivityId: type === 'time' && linkedActivityId ? linkedActivityId : undefined,
    };

    if (editHabit) {
      updateHabit(editHabit.id, habitData);
      toast.success('Habit updated');
    } else {
      addHabit(habitData);
      toast.success('Habit created');
    }

    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg border border-border animate-scale-in my-8">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {editHabit ? 'Edit Habit' : 'Create New Habit'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Habit Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g., Exercise 30 min"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Type</label>
            <div className="flex gap-2">
              {(['binary', 'time', 'count'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    type === t 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t === 'binary' ? 'Yes/No' : t === 'time' ? 'Time' : 'Count'}
                </button>
              ))}
            </div>
          </div>

          {/* Target for time-based */}
          {type === 'time' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Target (minutes/day)</label>
              <input
                type="number"
                min="1"
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Target for count-based */}
          {type === 'count' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Target Count/day</label>
              <input
                type="number"
                min="1"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Link to activity for time-based habits */}
          {type === 'time' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Link to Time Tracker Activity (optional)</label>
              <select
                value={linkedActivityId}
                onChange={(e) => setLinkedActivityId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">No link</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Time tracked for this activity will auto-count toward the habit
              </p>
            </div>
          )}

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Frequency</label>
            <div className="flex gap-2 mb-3">
              {(['daily', 'daysOfWeek', 'timesPerWeek'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequencyType(f)}
                  className={cn(
                    "flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors",
                    frequencyType === f 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {f === 'daily' ? 'Daily' : f === 'daysOfWeek' ? 'Specific Days' : 'X per Week'}
                </button>
              ))}
            </div>

            {frequencyType === 'daysOfWeek' && (
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
                      selectedDays.includes(i)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}

            {frequencyType === 'timesPerWeek' && (
              <input
                type="number"
                min="1"
                max="7"
                value={timesPerWeek}
                onChange={(e) => setTimesPerWeek(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {HABIT_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform",
                    color === c && "ring-2 ring-offset-2 ring-primary scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              {editHabit ? 'Update' : 'Create'}
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
