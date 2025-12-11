import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  TimeEntry, 
  Habit, 
  HabitLog, 
  ActiveTimer, 
  HabitStats,
  DailySummary,
  TimePeriodBreakdown 
} from '@/lib/types';
import { getDateString, formatDateDisplay, getDateRange } from '@/lib/timeUtils';
import { 
  loadActivities, 
  loadTimeEntries, 
  loadHabits, 
  loadHabitLogs,
  loadActiveTimer, 
  saveActiveTimer,
  addTimeEntry,
  deleteTimeEntry,
  getEntriesForDate,
  upsertHabitLog,
  getHabitLog,
  deleteHabit,
  getLastReminderDate,
  setLastReminderDate
} from '@/lib/storage';
import { 
  calculateHabitStats, 
  isHabitScheduledForDate, 
  getHabitProgressFromTimeTracker,
  getDailySummary,
  getRangeSummaries,
  getAggregatedSummary,
  getTimePeriodBreakdown
} from '@/lib/analytics';
import { generateDailyPDF } from '@/lib/pdfExport';
import { Navigation, DateNavigation } from '@/components/layout/Navigation';
import { ActivityCard } from '@/components/tracker/ActivityCard';
import { TimeEntryCard } from '@/components/tracker/TimeEntryCard';
import { ManualEntryDialog } from '@/components/tracker/ManualEntryDialog';
import { HabitCard } from '@/components/habits/HabitCard';
import { HabitDialog } from '@/components/habits/HabitDialog';
import { HabitCalendar } from '@/components/habits/HabitCalendar';
import { ActivityChart } from '@/components/analytics/ActivityChart';
import { DailyTrendChart } from '@/components/analytics/DailyTrendChart';
import { TimePeriodChart } from '@/components/analytics/TimePeriodChart';
import { SettingsView } from '@/components/settings/SettingsView';
import { toast } from 'sonner';
import { Plus, FileDown, X, Flame, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'today' | 'habits' | 'analytics' | 'settings';
type AnalyticsRange = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

const Index = () => {
  // Core state
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [selectedDate, setSelectedDate] = useState(getDateString());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // UI state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showHabitDialog, setShowHabitDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showYesterdayReminder, setShowYesterdayReminder] = useState(false);

  // Analytics state
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>('7days');
  const [customStartDate, setCustomStartDate] = useState(getDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const [customEndDate, setCustomEndDate] = useState(getDateString());

  // Load data on mount
  useEffect(() => {
    loadAllData();
    checkYesterdayReminder();
  }, []);

  const loadAllData = useCallback(() => {
    setActivities(loadActivities());
    setTimeEntries(loadTimeEntries());
    setHabits(loadHabits());
    setHabitLogs(loadHabitLogs());
    setActiveTimer(loadActiveTimer());
  }, []);

  // Check if should show yesterday's report reminder
  const checkYesterdayReminder = () => {
    const today = getDateString();
    const lastReminder = getLastReminderDate();
    
    if (lastReminder !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEntries = getEntriesForDate(getDateString(yesterday));
      
      if (yesterdayEntries.length > 0) {
        setShowYesterdayReminder(true);
      }
      setLastReminderDate(today);
    }
  };

  // Timer tick effect
  useEffect(() => {
    if (!activeTimer) {
      setElapsedTime(0);
      return;
    }

    const tick = () => {
      setElapsedTime(Date.now() - activeTimer.startTime);
    };

    tick(); // Initial tick
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Timer handlers
  const handleStartTimer = (activityId: string) => {
    // If another timer is running, stop it first
    if (activeTimer && activeTimer.activityId !== activityId) {
      handleStopTimer();
    }

    const timer: ActiveTimer = {
      activityId,
      startTime: Date.now(),
    };
    setActiveTimer(timer);
    saveActiveTimer(timer);
    
    const activity = activities.find(a => a.id === activityId);
    toast.success(`Started tracking ${activity?.name}`);
  };

  const handleStopTimer = () => {
    if (!activeTimer) return;

    const endTime = Date.now();
    const durationMs = endTime - activeTimer.startTime;
    const date = getDateString(new Date(activeTimer.startTime));

    addTimeEntry({
      activityId: activeTimer.activityId,
      startTime: activeTimer.startTime,
      endTime,
      durationMs,
      date,
      notes: '',
    });

    const activity = activities.find(a => a.id === activeTimer.activityId);
    toast.success(`Stopped ${activity?.name} - ${Math.floor(durationMs / 60000)}m tracked`);

    // Check if any habits should be auto-updated
    updateHabitsFromTimeTracker(activeTimer.activityId, date);

    setActiveTimer(null);
    saveActiveTimer(null);
    loadAllData();
  };

  const updateHabitsFromTimeTracker = (activityId: string, date: string) => {
    const linkedHabits = habits.filter(h => h.linkedActivityId === activityId);
    linkedHabits.forEach(habit => {
      const totalSeconds = getHabitProgressFromTimeTracker(habit, date);
      const targetSeconds = habit.targetMinutes * 60;
      
      if (totalSeconds >= targetSeconds) {
        upsertHabitLog(habit.id, date, { completed: true, progressValue: totalSeconds });
      }
    });
  };

  // Entry handlers
  const handleDeleteEntry = (id: string) => {
    if (confirm('Delete this time entry?')) {
      deleteTimeEntry(id);
      loadAllData();
      toast.success('Entry deleted');
    }
  };

  // Habit handlers
  const handleToggleHabit = (habit: Habit) => {
    const today = selectedDate;
    const log = habitLogs.find(l => l.habitId === habit.id && l.date === today);
    const newCompleted = !log?.completed;
    
    upsertHabitLog(habit.id, today, { 
      completed: newCompleted,
      progressValue: log?.progressValue || 0 
    });
    loadAllData();
  };

  const handleAddHabitProgress = (habit: Habit, value: number) => {
    const today = selectedDate;
    const log = habitLogs.find(l => l.habitId === habit.id && l.date === today);
    const currentProgress = log?.progressValue || 0;
    const newProgress = Math.max(0, currentProgress + value);
    
    // Check if target reached
    const targetValue = habit.type === 'time' ? habit.targetMinutes * 60 : habit.targetCount;
    const completed = newProgress >= targetValue;
    
    upsertHabitLog(habit.id, today, { 
      progressValue: newProgress,
      completed: completed || log?.completed || false
    });
    loadAllData();
  };

  const handleDeleteHabit = (id: string) => {
    if (confirm('Delete this habit and all its history?')) {
      deleteHabit(id);
      loadAllData();
      toast.success('Habit deleted');
    }
  };

  // Get analytics date range
  const getAnalyticsDateRange = (): { start: string; end: string } => {
    const today = new Date();
    
    switch (analyticsRange) {
      case 'today':
        return { start: getDateString(), end: getDateString() };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: getDateString(yesterday), end: getDateString(yesterday) };
      case '7days':
        const week = new Date(today);
        week.setDate(week.getDate() - 6);
        return { start: getDateString(week), end: getDateString() };
      case '30days':
        const month = new Date(today);
        month.setDate(month.getDate() - 29);
        return { start: getDateString(month), end: getDateString() };
      case 'custom':
        return { start: customStartDate, end: customEndDate };
      default:
        return { start: getDateString(), end: getDateString() };
    }
  };

  // Filter entries for selected date
  const todayEntries = timeEntries
    .filter(e => e.date === selectedDate)
    .sort((a, b) => a.startTime - b.startTime);

  // Filter habits scheduled for selected date
  const scheduledHabits = habits.filter(h => isHabitScheduledForDate(h, selectedDate));

  // Calculate habit stats
  const habitStats = habits.reduce((acc, habit) => {
    acc[habit.id] = calculateHabitStats(habit);
    return acc;
  }, {} as Record<string, HabitStats>);

  // Download yesterday's report
  const handleDownloadYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    generateDailyPDF(getDateString(yesterday));
    setShowYesterdayReminder(false);
    toast.success('Yesterday\'s report downloaded');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Yesterday reminder banner */}
      {showYesterdayReminder && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-3 flex items-center justify-between animate-fade-in">
          <span className="text-sm">
            Download yesterday's report?
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadYesterday}
              className="px-3 py-1 rounded-lg bg-primary-foreground/20 text-sm font-medium hover:bg-primary-foreground/30 transition-colors"
            >
              Download Now
            </button>
            <button
              onClick={() => setShowYesterdayReminder(false)}
              className="p-1 rounded-lg hover:bg-primary-foreground/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {/* Navigation */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main content */}
        <main className="flex-1 pb-24 md:pb-8 pt-4 px-4 md:px-8">
          {/* TODAY VIEW */}
          {activeTab === 'today' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Time Tracker</h1>
                  <p className="text-muted-foreground">{formatDateDisplay(selectedDate)}</p>
                </div>
                <DateNavigation date={selectedDate} onDateChange={setSelectedDate} />
              </div>

              {/* Activity Grid */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Activities</h2>
                </div>
                
                {activities.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-card border border-border">
                    <p className="text-muted-foreground mb-4">No activities yet. Add some to start tracking!</p>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
                    >
                      Manage Activities
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {activities.map(activity => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        activeTimer={activeTimer}
                        elapsedTime={elapsedTime}
                        onStart={handleStartTimer}
                        onStop={handleStopTimer}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Today's Timeline */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Timeline ({todayEntries.length} entries)
                  </h2>
                  <button
                    onClick={() => {
                      setEditingEntry(null);
                      setShowManualEntry(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </button>
                </div>

                {todayEntries.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-card border border-border">
                    <p className="text-muted-foreground">No time entries for this day yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayEntries.map(entry => (
                      <TimeEntryCard
                        key={entry.id}
                        entry={entry}
                        activity={activities.find(a => a.id === entry.activityId)}
                        onEdit={(e) => {
                          setEditingEntry(e);
                          setShowManualEntry(true);
                        }}
                        onDelete={handleDeleteEntry}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Daily Summary */}
              {todayEntries.length > 0 && (
                <section className="p-6 rounded-2xl bg-card border border-border shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Daily Summary</h2>
                    <button
                      onClick={() => {
                        generateDailyPDF(selectedDate);
                        toast.success('PDF downloaded');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      <FileDown className="w-4 h-4" />
                      PDF
                    </button>
                  </div>
                  <ActivityChart 
                    summaries={getDailySummary(selectedDate).activities}
                    totalMs={getDailySummary(selectedDate).totalDurationMs}
                  />
                </section>
              )}
            </div>
          )}

          {/* HABITS VIEW */}
          {activeTab === 'habits' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Habits</h1>
                  <p className="text-muted-foreground">{formatDateDisplay(selectedDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <DateNavigation date={selectedDate} onDateChange={setSelectedDate} />
                  <button
                    onClick={() => {
                      setEditingHabit(null);
                      setShowHabitDialog(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Habit
                  </button>
                </div>
              </div>

              {/* Habit Checklist */}
              {scheduledHabits.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-card border border-border">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No habits for today</h3>
                  <p className="text-muted-foreground mb-4">
                    {habits.length === 0 
                      ? "Create your first habit to start tracking!"
                      : "No habits scheduled for this day."}
                  </p>
                  {habits.length === 0 && (
                    <button
                      onClick={() => setShowHabitDialog(true)}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
                    >
                      Create Habit
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledHabits.map(habit => {
                    const log = habitLogs.find(l => l.habitId === habit.id && l.date === selectedDate);
                    const autoProgress = habit.linkedActivityId 
                      ? getHabitProgressFromTimeTracker(habit, selectedDate)
                      : 0;
                    
                    return (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        log={log}
                        stats={habitStats[habit.id]}
                        autoProgress={autoProgress}
                        onToggleComplete={() => handleToggleHabit(habit)}
                        onAddProgress={(val) => handleAddHabitProgress(habit, val)}
                        onEdit={() => {
                          setEditingHabit(habit);
                          setShowHabitDialog(true);
                        }}
                        onDelete={() => handleDeleteHabit(habit.id)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Habit Stats Overview */}
              {habits.length > 0 && (
                <section className="grid gap-4 md:grid-cols-2">
                  {habits.slice(0, 4).map(habit => (
                    <div key={habit.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: habit.color }}
                        />
                        <span className="font-medium text-foreground">{habit.name}</span>
                        {habitStats[habit.id]?.currentStreak > 0 && (
                          <div className="flex items-center gap-1 text-accent">
                            <Flame className="w-4 h-4" />
                            <span className="text-sm font-semibold">
                              {habitStats[habit.id].currentStreak}
                            </span>
                          </div>
                        )}
                      </div>
                      <HabitCalendar 
                        habit={habit} 
                        logs={habitLogs.filter(l => l.habitId === habit.id)}
                      />
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Best: {habitStats[habit.id]?.bestStreak || 0} days</span>
                        <span>7d: {habitStats[habit.id]?.completionRate7Days || 0}%</span>
                        <span>30d: {habitStats[habit.id]?.completionRate30Days || 0}%</span>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}

          {/* ANALYTICS VIEW */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-muted-foreground">Insights into your time and habits</p>
              </div>

              {/* Range selector */}
              <div className="flex flex-wrap gap-2">
                {([
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: '7days', label: 'Last 7 Days' },
                  { id: '30days', label: 'Last 30 Days' },
                  { id: 'custom', label: 'Custom' },
                ] as const).map(range => (
                  <button
                    key={range.id}
                    onClick={() => setAnalyticsRange(range.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      analyticsRange === range.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              {analyticsRange === 'custom' && (
                <div className="flex gap-3 items-center">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-background border border-input text-foreground"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-background border border-input text-foreground"
                  />
                </div>
              )}

              {/* Activity Summary */}
              <section className="p-6 rounded-2xl bg-card border border-border shadow-card">
                <h2 className="text-lg font-semibold text-foreground mb-4">Time by Activity</h2>
                {(() => {
                  const { start, end } = getAnalyticsDateRange();
                  const summaries = getAggregatedSummary(start, end);
                  const totalMs = summaries.reduce((sum, s) => sum + s.totalDurationMs, 0);
                  return (
                    <ActivityChart 
                      summaries={summaries} 
                      totalMs={totalMs}
                      showPercentOfDay={analyticsRange === 'today' || analyticsRange === 'yesterday'}
                    />
                  );
                })()}
              </section>

              {/* Daily Trend */}
              {(analyticsRange === '7days' || analyticsRange === '30days' || analyticsRange === 'custom') && (
                <section className="p-6 rounded-2xl bg-card border border-border shadow-card">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Daily Trend</h2>
                  {(() => {
                    const { start, end } = getAnalyticsDateRange();
                    const summaries = getRangeSummaries(start, end);
                    return <DailyTrendChart summaries={summaries} />;
                  })()}
                </section>
              )}

              {/* Time of Day */}
              <section className="p-6 rounded-2xl bg-card border border-border shadow-card">
                <h2 className="text-lg font-semibold text-foreground mb-4">Time of Day</h2>
                {(() => {
                  const { start, end } = getAnalyticsDateRange();
                  const breakdown = getTimePeriodBreakdown(start, end);
                  return <TimePeriodChart breakdown={breakdown} />;
                })()}
              </section>

              {/* Habit Analytics */}
              {habits.length > 0 && (
                <section className="p-6 rounded-2xl bg-card border border-border shadow-card">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Habit Stats</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-sm font-medium text-muted-foreground">Habit</th>
                          <th className="text-center py-2 text-sm font-medium text-muted-foreground">Current Streak</th>
                          <th className="text-center py-2 text-sm font-medium text-muted-foreground">Best Streak</th>
                          <th className="text-center py-2 text-sm font-medium text-muted-foreground">7 Day %</th>
                          <th className="text-center py-2 text-sm font-medium text-muted-foreground">30 Day %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {habits.map(habit => (
                          <tr key={habit.id} className="border-b border-border/50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: habit.color }}
                                />
                                <span className="font-medium text-foreground">{habit.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-3">
                              <div className="flex items-center justify-center gap-1">
                                {habitStats[habit.id]?.currentStreak > 0 && (
                                  <Flame className="w-4 h-4 text-accent" />
                                )}
                                <span className="font-semibold text-foreground">
                                  {habitStats[habit.id]?.currentStreak || 0}
                                </span>
                              </div>
                            </td>
                            <td className="text-center py-3 font-medium text-foreground">
                              {habitStats[habit.id]?.bestStreak || 0}
                            </td>
                            <td className="text-center py-3 font-medium text-foreground">
                              {habitStats[habit.id]?.completionRate7Days || 0}%
                            </td>
                            <td className="text-center py-3 font-medium text-foreground">
                              {habitStats[habit.id]?.completionRate30Days || 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage activities, backup data, and more</p>
              </div>
              <SettingsView activities={activities} onDataChange={loadAllData} />
            </div>
          )}
        </main>
      </div>

      {/* Manual Entry Dialog */}
      <ManualEntryDialog
        isOpen={showManualEntry}
        onClose={() => {
          setShowManualEntry(false);
          setEditingEntry(null);
        }}
        activities={activities}
        editEntry={editingEntry}
        selectedDate={selectedDate}
        onSave={loadAllData}
      />

      {/* Habit Dialog */}
      <HabitDialog
        isOpen={showHabitDialog}
        onClose={() => {
          setShowHabitDialog(false);
          setEditingHabit(null);
        }}
        editHabit={editingHabit}
        onSave={loadAllData}
      />
    </div>
  );
};

export default Index;
