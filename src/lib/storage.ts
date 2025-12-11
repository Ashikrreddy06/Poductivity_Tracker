/**
 * LocalStorage management for the Time + Habit Tracker
 * All data persistence is handled here
 */

import { 
  Activity, 
  TimeEntry, 
  Habit, 
  HabitLog, 
  ActiveTimer,
  STORAGE_KEYS,
  DEFAULT_ACTIVITIES 
} from './types';

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Save data to localStorage
function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
}

// Load data from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
  }
  return defaultValue;
}

// ==================== ACTIVITIES ====================

export function loadActivities(): Activity[] {
  const activities = loadFromStorage<Activity[]>(STORAGE_KEYS.ACTIVITIES, []);
  
  // Initialize with defaults if empty
  if (activities.length === 0) {
    const defaultActivities: Activity[] = DEFAULT_ACTIVITIES.map(a => ({
      ...a,
      id: generateId(),
      createdAt: Date.now(),
    }));
    saveActivities(defaultActivities);
    return defaultActivities;
  }
  
  return activities;
}

export function saveActivities(activities: Activity[]): void {
  saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);
}

export function addActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Activity {
  const newActivity: Activity = {
    ...activity,
    id: generateId(),
    createdAt: Date.now(),
  };
  const activities = loadActivities();
  activities.push(newActivity);
  saveActivities(activities);
  return newActivity;
}

export function updateActivity(id: string, updates: Partial<Activity>): Activity | null {
  const activities = loadActivities();
  const index = activities.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  activities[index] = { ...activities[index], ...updates };
  saveActivities(activities);
  return activities[index];
}

export function deleteActivity(id: string): boolean {
  const activities = loadActivities();
  const filtered = activities.filter(a => a.id !== id);
  if (filtered.length === activities.length) return false;
  
  saveActivities(filtered);
  return true;
}

// ==================== TIME ENTRIES ====================

export function loadTimeEntries(): TimeEntry[] {
  return loadFromStorage<TimeEntry[]>(STORAGE_KEYS.TIME_ENTRIES, []);
}

export function saveTimeEntries(entries: TimeEntry[]): void {
  saveToStorage(STORAGE_KEYS.TIME_ENTRIES, entries);
}

export function addTimeEntry(entry: Omit<TimeEntry, 'id'>): TimeEntry {
  const newEntry: TimeEntry = {
    ...entry,
    id: generateId(),
  };
  const entries = loadTimeEntries();
  entries.push(newEntry);
  saveTimeEntries(entries);
  return newEntry;
}

export function updateTimeEntry(id: string, updates: Partial<TimeEntry>): TimeEntry | null {
  const entries = loadTimeEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index === -1) return null;
  
  entries[index] = { ...entries[index], ...updates };
  saveTimeEntries(entries);
  return entries[index];
}

export function deleteTimeEntry(id: string): boolean {
  const entries = loadTimeEntries();
  const filtered = entries.filter(e => e.id !== id);
  if (filtered.length === entries.length) return false;
  
  saveTimeEntries(filtered);
  return true;
}

export function getEntriesForDate(date: string): TimeEntry[] {
  return loadTimeEntries().filter(e => e.date === date).sort((a, b) => a.startTime - b.startTime);
}

export function getEntriesInRange(startDate: string, endDate: string): TimeEntry[] {
  return loadTimeEntries()
    .filter(e => e.date >= startDate && e.date <= endDate)
    .sort((a, b) => a.startTime - b.startTime);
}

// ==================== ACTIVE TIMER ====================

export function loadActiveTimer(): ActiveTimer | null {
  return loadFromStorage<ActiveTimer | null>(STORAGE_KEYS.ACTIVE_TIMER, null);
}

export function saveActiveTimer(timer: ActiveTimer | null): void {
  saveToStorage(STORAGE_KEYS.ACTIVE_TIMER, timer);
}

// ==================== HABITS ====================

export function loadHabits(): Habit[] {
  return loadFromStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
}

export function saveHabits(habits: Habit[]): void {
  saveToStorage(STORAGE_KEYS.HABITS, habits);
}

export function addHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Habit {
  const newHabit: Habit = {
    ...habit,
    id: generateId(),
    createdAt: Date.now(),
  };
  const habits = loadHabits();
  habits.push(newHabit);
  saveHabits(habits);
  return newHabit;
}

export function updateHabit(id: string, updates: Partial<Habit>): Habit | null {
  const habits = loadHabits();
  const index = habits.findIndex(h => h.id === id);
  if (index === -1) return null;
  
  habits[index] = { ...habits[index], ...updates };
  saveHabits(habits);
  return habits[index];
}

export function deleteHabit(id: string): boolean {
  const habits = loadHabits();
  const filtered = habits.filter(h => h.id !== id);
  if (filtered.length === habits.length) return false;
  
  saveHabits(filtered);
  
  // Also delete associated logs
  const logs = loadHabitLogs().filter(l => l.habitId !== id);
  saveHabitLogs(logs);
  
  return true;
}

// ==================== HABIT LOGS ====================

export function loadHabitLogs(): HabitLog[] {
  return loadFromStorage<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, []);
}

export function saveHabitLogs(logs: HabitLog[]): void {
  saveToStorage(STORAGE_KEYS.HABIT_LOGS, logs);
}

export function getHabitLog(habitId: string, date: string): HabitLog | undefined {
  return loadHabitLogs().find(l => l.habitId === habitId && l.date === date);
}

export function upsertHabitLog(habitId: string, date: string, updates: Partial<HabitLog>): HabitLog {
  const logs = loadHabitLogs();
  const existing = logs.find(l => l.habitId === habitId && l.date === date);
  
  if (existing) {
    const index = logs.indexOf(existing);
    logs[index] = { ...existing, ...updates };
    saveHabitLogs(logs);
    return logs[index];
  } else {
    const newLog: HabitLog = {
      id: generateId(),
      habitId,
      date,
      completed: false,
      progressValue: 0,
      notes: '',
      ...updates,
    };
    logs.push(newLog);
    saveHabitLogs(logs);
    return newLog;
  }
}

export function getHabitLogsInRange(habitId: string, startDate: string, endDate: string): HabitLog[] {
  return loadHabitLogs()
    .filter(l => l.habitId === habitId && l.date >= startDate && l.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ==================== BACKUP / RESTORE ====================

export interface BackupData {
  activities: Activity[];
  timeEntries: TimeEntry[];
  habits: Habit[];
  habitLogs: HabitLog[];
  exportedAt: number;
  version: string;
}

export function exportAllData(): BackupData {
  return {
    activities: loadActivities(),
    timeEntries: loadTimeEntries(),
    habits: loadHabits(),
    habitLogs: loadHabitLogs(),
    exportedAt: Date.now(),
    version: '1.0',
  };
}

export function importAllData(data: BackupData): boolean {
  try {
    if (data.activities) saveActivities(data.activities);
    if (data.timeEntries) saveTimeEntries(data.timeEntries);
    if (data.habits) saveHabits(data.habits);
    if (data.habitLogs) saveHabitLogs(data.habitLogs);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// ==================== REMINDER ====================

export function getLastReminderDate(): string | null {
  return loadFromStorage<string | null>(STORAGE_KEYS.LAST_REMINDER_DATE, null);
}

export function setLastReminderDate(date: string): void {
  saveToStorage(STORAGE_KEYS.LAST_REMINDER_DATE, date);
}
