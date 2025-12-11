/**
 * Analytics calculations for Time + Habit Tracker
 */

import { 
  Activity, 
  TimeEntry, 
  Habit, 
  HabitLog,
  ActivitySummary, 
  DailySummary, 
  HabitStats,
  TimePeriodBreakdown
} from './types';
import { 
  getDateString, 
  getDateRange, 
  getTimePeriod, 
  calculatePercentage,
  getDayBounds
} from './timeUtils';
import { loadActivities, loadTimeEntries, loadHabits, loadHabitLogs, getHabitLogsInRange } from './storage';

// Calculate activity summary for a list of entries
export function calculateActivitySummary(entries: TimeEntry[], activities: Activity[]): ActivitySummary[] {
  const summaryMap = new Map<string, { totalMs: number; count: number }>();
  
  entries.forEach(entry => {
    const current = summaryMap.get(entry.activityId) || { totalMs: 0, count: 0 };
    summaryMap.set(entry.activityId, {
      totalMs: current.totalMs + entry.durationMs,
      count: current.count + 1,
    });
  });
  
  const totalDuration = Array.from(summaryMap.values()).reduce((sum, v) => sum + v.totalMs, 0);
  
  const summaries: ActivitySummary[] = [];
  summaryMap.forEach((value, activityId) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      summaries.push({
        activityId,
        activityName: activity.name,
        color: activity.color,
        totalDurationMs: value.totalMs,
        percentage: calculatePercentage(value.totalMs, totalDuration),
        entryCount: value.count,
      });
    }
  });
  
  return summaries.sort((a, b) => b.totalDurationMs - a.totalDurationMs);
}

// Get daily summary for a specific date
export function getDailySummary(date: string): DailySummary {
  const activities = loadActivities();
  const entries = loadTimeEntries().filter(e => e.date === date);
  const activitySummaries = calculateActivitySummary(entries, activities);
  const totalDuration = activitySummaries.reduce((sum, a) => sum + a.totalDurationMs, 0);
  
  return {
    date,
    totalDurationMs: totalDuration,
    activities: activitySummaries,
  };
}

// Get summaries for a date range
export function getRangeSummaries(startDate: string, endDate: string): DailySummary[] {
  const dates = getDateRange(startDate, endDate);
  return dates.map(date => getDailySummary(date));
}

// Get aggregated summary for a date range
export function getAggregatedSummary(startDate: string, endDate: string): ActivitySummary[] {
  const activities = loadActivities();
  const entries = loadTimeEntries().filter(e => e.date >= startDate && e.date <= endDate);
  return calculateActivitySummary(entries, activities);
}

// Get time-of-day breakdown
export function getTimePeriodBreakdown(startDate: string, endDate: string): TimePeriodBreakdown {
  const activities = loadActivities();
  const entries = loadTimeEntries().filter(e => e.date >= startDate && e.date <= endDate);
  
  const periodEntries = {
    morning: [] as TimeEntry[],
    afternoon: [] as TimeEntry[],
    evening: [] as TimeEntry[],
    night: [] as TimeEntry[],
  };
  
  entries.forEach(entry => {
    const period = getTimePeriod(entry.startTime);
    periodEntries[period].push(entry);
  });
  
  return {
    morning: calculateActivitySummary(periodEntries.morning, activities),
    afternoon: calculateActivitySummary(periodEntries.afternoon, activities),
    evening: calculateActivitySummary(periodEntries.evening, activities),
    night: calculateActivitySummary(periodEntries.night, activities),
  };
}

// Calculate habit stats
export function calculateHabitStats(habit: Habit): HabitStats {
  const logs = loadHabitLogs().filter(l => l.habitId === habit.id);
  const today = getDateString();
  
  // Sort logs by date descending
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  
  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(today);
  
  // Check if habit is scheduled for today and not completed
  const isScheduledToday = isHabitScheduledForDate(habit, today);
  const todayLog = logs.find(l => l.date === today);
  const todayCompleted = todayLog?.completed || false;
  
  // If scheduled today and not completed, start checking from yesterday
  if (isScheduledToday && !todayCompleted) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  // Count consecutive completions
  while (true) {
    const dateStr = getDateString(checkDate);
    const log = logs.find(l => l.date === dateStr);
    const scheduled = isHabitScheduledForDate(habit, dateStr);
    
    if (!scheduled) {
      // Skip non-scheduled days
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }
    
    if (log?.completed) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
    
    // Safety limit
    if (currentStreak > 1000) break;
  }
  
  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 0;
  const allDates = logs.map(l => l.date).sort();
  
  for (let i = 0; i < allDates.length; i++) {
    const log = logs.find(l => l.date === allDates[i]);
    if (log?.completed) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  bestStreak = Math.max(bestStreak, currentStreak);
  
  // Calculate completion rates
  const last7Days = getCompletionRate(habit, 7);
  const last30Days = getCompletionRate(habit, 30);
  
  // Total completions
  const totalCompletions = logs.filter(l => l.completed).length;
  
  return {
    habitId: habit.id,
    currentStreak,
    bestStreak,
    completionRate7Days: last7Days,
    completionRate30Days: last30Days,
    totalCompletions,
  };
}

// Check if habit is scheduled for a specific date
export function isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  
  switch (habit.frequencyType) {
    case 'daily':
      return true;
    case 'daysOfWeek':
      return habit.frequencyData.includes(dayOfWeek);
    case 'timesPerWeek':
      // For X times per week, consider all days as potential
      return true;
    default:
      return true;
  }
}

// Get completion rate for last N days
function getCompletionRate(habit: Habit, days: number): number {
  const today = new Date();
  let scheduledDays = 0;
  let completedDays = 0;
  const logs = loadHabitLogs().filter(l => l.habitId === habit.id);
  
  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = getDateString(checkDate);
    
    if (isHabitScheduledForDate(habit, dateStr)) {
      scheduledDays++;
      const log = logs.find(l => l.date === dateStr);
      if (log?.completed) {
        completedDays++;
      }
    }
  }
  
  return scheduledDays > 0 ? Math.round((completedDays / scheduledDays) * 100) : 0;
}

// Get habit progress for a date (auto-link with time tracker)
export function getHabitProgressFromTimeTracker(habit: Habit, date: string): number {
  if (!habit.linkedActivityId) return 0;
  
  const entries = loadTimeEntries().filter(
    e => e.date === date && e.activityId === habit.linkedActivityId
  );
  
  const totalMs = entries.reduce((sum, e) => sum + e.durationMs, 0);
  return Math.floor(totalMs / 1000); // Return seconds
}
