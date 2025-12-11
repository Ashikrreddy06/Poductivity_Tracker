/**
 * Type definitions for the Time + Habit Tracker app
 */

// Activity definition
export interface Activity {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

// Time entry for tracking
export interface TimeEntry {
  id: string;
  activityId: string;
  startTime: number; // timestamp in ms
  endTime: number; // timestamp in ms
  durationMs: number;
  date: string; // YYYY-MM-DD
  notes: string;
}

// Currently running timer
export interface ActiveTimer {
  activityId: string;
  startTime: number;
}

// Habit frequency types
export type HabitFrequencyType = 'daily' | 'daysOfWeek' | 'timesPerWeek';

// Habit type
export type HabitType = 'binary' | 'time' | 'count';

// Habit definition
export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  frequencyType: HabitFrequencyType;
  frequencyData: number[]; // days of week [0-6] or times per week
  targetMinutes: number; // for time-based habits
  targetCount: number; // for count-based habits
  category: string;
  color: string;
  linkedActivityId?: string; // optional link to time tracker activity
  createdAt: number;
}

// Habit log entry
export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  progressValue: number; // minutes for time-based, count for count-based
  notes: string;
}

// Analytics data structures
export interface ActivitySummary {
  activityId: string;
  activityName: string;
  color: string;
  totalDurationMs: number;
  percentage: number;
  entryCount: number;
}

export interface DailySummary {
  date: string;
  totalDurationMs: number;
  activities: ActivitySummary[];
}

export interface HabitStats {
  habitId: string;
  currentStreak: number;
  bestStreak: number;
  completionRate7Days: number;
  completionRate30Days: number;
  totalCompletions: number;
}

// Time period analytics
export interface TimePeriodBreakdown {
  morning: ActivitySummary[];
  afternoon: ActivitySummary[];
  evening: ActivitySummary[];
  night: ActivitySummary[];
}

// App state
export interface AppState {
  activities: Activity[];
  timeEntries: TimeEntry[];
  habits: Habit[];
  habitLogs: HabitLog[];
  activeTimer: ActiveTimer | null;
  selectedDate: string;
}

// Storage keys
export const STORAGE_KEYS = {
  ACTIVITIES: 'timeTracker_activities',
  TIME_ENTRIES: 'timeTracker_timeEntries',
  HABITS: 'timeTracker_habits',
  HABIT_LOGS: 'timeTracker_habitLogs',
  ACTIVE_TIMER: 'timeTracker_activeTimer',
  LAST_REMINDER_DATE: 'timeTracker_lastReminderDate',
} as const;

// Default activity colors
export const DEFAULT_COLORS = [
  'hsl(142, 70%, 45%)', // exercise - green
  'hsl(217, 91%, 60%)', // study - blue
  'hsl(262, 83%, 58%)', // work - purple
  'hsl(330, 81%, 60%)', // play - pink
  'hsl(32, 95%, 55%)', // eat - orange
  'hsl(220, 70%, 50%)', // sleep - dark blue
  'hsl(174, 72%, 50%)', // relax - teal
  'hsl(280, 70%, 50%)', // custom - violet
  'hsl(0, 72%, 51%)', // red
  'hsl(45, 93%, 55%)', // yellow
];

// Default activities
export const DEFAULT_ACTIVITIES: Omit<Activity, 'id' | 'createdAt'>[] = [
  { name: 'Exercise', color: DEFAULT_COLORS[0] },
  { name: 'Study', color: DEFAULT_COLORS[1] },
  { name: 'Work', color: DEFAULT_COLORS[2] },
  { name: 'Play', color: DEFAULT_COLORS[3] },
  { name: 'Eat', color: DEFAULT_COLORS[4] },
  { name: 'Sleep', color: DEFAULT_COLORS[5] },
  { name: 'Relax', color: DEFAULT_COLORS[6] },
];

// Habit categories
export const HABIT_CATEGORIES = [
  'Health',
  'Fitness',
  'Study',
  'Work',
  'Personal',
  'Social',
  'Creative',
  'Other',
];

// Days of week
export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_OF_WEEK_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
