/**
 * PDF Export functionality using jsPDF
 */

import jsPDF from 'jspdf';
import { Activity, TimeEntry, Habit, HabitLog } from './types';
import { 
  formatDateDisplay, 
  formatTime24h, 
  formatDurationHHMMSS, 
  calculatePercentage,
  MS_PER_DAY 
} from './timeUtils';
import { loadActivities, loadHabits, loadHabitLogs, getEntriesForDate } from './storage';
import { calculateActivitySummary, calculateHabitStats, isHabitScheduledForDate } from './analytics';

export function generateDailyPDF(date: string): void {
  const doc = new jsPDF();
  const activities = loadActivities();
  const entries = getEntriesForDate(date);
  const habits = loadHabits();
  const habitLogs = loadHabitLogs().filter(l => l.date === date);
  
  let y = 20;
  const leftMargin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Report', leftMargin, y);
  y += 10;
  
  // Date
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateDisplay(date), leftMargin, y);
  y += 15;
  
  // ==================== TIME TRACKER SECTION ====================
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Time Tracker', leftMargin, y);
  y += 8;
  
  // Activity Summary
  const summaries = calculateActivitySummary(entries, activities);
  const totalTracked = summaries.reduce((sum, s) => sum + s.totalDurationMs, 0);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total tracked: ${formatDurationHHMMSS(totalTracked)} (${calculatePercentage(totalTracked, MS_PER_DAY)}% of day)`, leftMargin, y);
  y += 10;
  
  // Activity table header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Activity', leftMargin, y);
  doc.text('Duration', leftMargin + 60, y);
  doc.text('%', leftMargin + 100, y);
  y += 6;
  
  // Activity rows
  doc.setFont('helvetica', 'normal');
  summaries.forEach(summary => {
    doc.text(summary.activityName, leftMargin, y);
    doc.text(formatDurationHHMMSS(summary.totalDurationMs), leftMargin + 60, y);
    doc.text(`${summary.percentage}%`, leftMargin + 100, y);
    y += 5;
  });
  
  y += 10;
  
  // Timeline
  if (entries.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Timeline', leftMargin, y);
    y += 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Time Range', leftMargin, y);
    doc.text('Activity', leftMargin + 45, y);
    doc.text('Duration', leftMargin + 90, y);
    doc.text('Notes', leftMargin + 120, y);
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    entries.forEach(entry => {
      const activity = activities.find(a => a.id === entry.activityId);
      const timeRange = `${formatTime24h(entry.startTime)} - ${formatTime24h(entry.endTime)}`;
      
      doc.text(timeRange, leftMargin, y);
      doc.text(activity?.name || 'Unknown', leftMargin + 45, y);
      doc.text(formatDurationHHMMSS(entry.durationMs), leftMargin + 90, y);
      
      // Truncate notes if too long
      const notes = entry.notes.length > 30 ? entry.notes.substring(0, 27) + '...' : entry.notes;
      doc.text(notes, leftMargin + 120, y);
      
      y += 5;
      
      // Check for page break
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  }
  
  y += 10;
  
  // ==================== HABITS SECTION ====================
  if (habits.length > 0) {
    // Check for page break
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Habit Tracker', leftMargin, y);
    y += 10;
    
    const scheduledHabits = habits.filter(h => isHabitScheduledForDate(h, date));
    
    scheduledHabits.forEach(habit => {
      const log = habitLogs.find(l => l.habitId === habit.id);
      const stats = calculateHabitStats(habit);
      const completed = log?.completed || false;
      const progress = log?.progressValue || 0;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(habit.name, leftMargin, y);
      
      doc.setFont('helvetica', 'normal');
      
      if (habit.type === 'binary') {
        const status = completed ? '✓ Completed' : '✗ Not completed';
        doc.text(status, leftMargin + 70, y);
      } else if (habit.type === 'time') {
        const targetSeconds = habit.targetMinutes * 60;
        doc.text(`${formatDurationHHMMSS(progress * 1000)} / ${formatDurationHHMMSS(targetSeconds * 1000)}`, leftMargin + 70, y);
      } else {
        doc.text(`${progress} / ${habit.targetCount}`, leftMargin + 70, y);
      }
      
      doc.text(`Streak: ${stats.currentStreak} days`, leftMargin + 130, y);
      
      y += 6;
      
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated on ${new Date().toLocaleString()}`, leftMargin, 285);
  
  // Save
  doc.save(`daily-report-${date}.pdf`);
}

export function downloadBackupJSON(): void {
  const data = {
    activities: loadActivities(),
    timeEntries: loadHabits(),
    habits: loadHabits(),
    habitLogs: loadHabitLogs(),
    exportedAt: Date.now(),
    version: '1.0',
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `time-habit-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
