import { 
  Clock, 
  Target, 
  BarChart2, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'today' | 'habits' | 'analytics' | 'settings';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs: { id: Tab; label: string; icon: typeof Clock }[] = [
    { id: 'today', label: 'Today', icon: Timer },
    { id: 'habits', label: 'Habits', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 md:relative md:border-t-0 md:border-r md:min-h-screen md:w-64">
      <div className="flex md:flex-col md:p-4 md:gap-2">
        {/* Logo for desktop */}
        <div className="hidden md:flex items-center gap-3 px-4 py-6 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Timer className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">TimeFlow</h1>
            <p className="text-xs text-muted-foreground">Track · Improve · Achieve</p>
          </div>
        </div>

        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 md:flex-none flex flex-col md:flex-row items-center md:gap-3 py-3 md:py-3 md:px-4 md:rounded-xl transition-all",
              activeTab === tab.id 
                ? "text-primary md:bg-primary/10" 
                : "text-muted-foreground hover:text-foreground md:hover:bg-muted"
            )}
          >
            <tab.icon className={cn(
              "w-5 h-5 md:w-5 md:h-5",
              activeTab === tab.id && "text-primary"
            )} />
            <span className="text-xs md:text-sm font-medium mt-1 md:mt-0">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

interface DateNavigationProps {
  date: string;
  onDateChange: (date: string) => void;
}

export function DateNavigation({ date, onDateChange }: DateNavigationProps) {
  const currentDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isToday = currentDate.toDateString() === today.toDateString();

  const navigate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    onDateChange(today.toISOString().split('T')[0]);
  };

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => navigate(-1)}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
      </button>
      
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {!isToday && (
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            Today
          </button>
        )}
      </div>
      
      <button 
        onClick={() => navigate(1)}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        disabled={isToday}
      >
        <ChevronRight className={cn(
          "w-5 h-5",
          isToday ? "text-muted" : "text-muted-foreground"
        )} />
      </button>
    </div>
  );
}
