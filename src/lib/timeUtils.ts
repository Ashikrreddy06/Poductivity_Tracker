/**
 * Time utility functions for formatting and calculations
 * All times are tracked with millisecond precision
 */

// Format timestamp to HH:MM:SS
export function formatTimeWithSeconds(timestamp: number | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  });
}

// Format timestamp to HH:MM:SS (24h)
export function formatTime24h(timestamp: number | Date): string {
  const date = new Date(timestamp);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Format duration from milliseconds to HH:MM:SS
export function formatDurationHHMMSS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Format duration as human-readable string
export function formatDurationReadable(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Parse time input (h, m, s) to timestamp on a given date
export function parseTimeInputToTimestamp(
  hours: number, 
  minutes: number, 
  seconds: number, 
  date: Date
): number {
  const result = new Date(date);
  result.setHours(hours, minutes, seconds, 0);
  return result.getTime();
}

// Get date string in YYYY-MM-DD format
export function getDateString(date: Date | number = new Date()): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// Get formatted date for display
export function formatDateDisplay(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Get short date format
export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

// Calculate percentage
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 10) / 10;
}

// Get time period of day
export function getTimePeriod(timestamp: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date(timestamp).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// Get start and end of day
export function getDayBounds(date: Date | string): { start: number; end: number } {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
  return { start, end };
}

// Get dates in range
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(getDateString(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Milliseconds in common time units
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
