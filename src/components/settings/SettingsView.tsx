import { useState, useRef } from 'react';
import { exportAllData, importAllData, clearAllData, BackupData } from '@/lib/storage';
import { generateDailyPDF } from '@/lib/pdfExport';
import { getDateString, formatDateDisplay } from '@/lib/timeUtils';
import { Download, Upload, Trash2, FileDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ActivityManager } from '../tracker/ActivityManager';
import { Activity } from '@/lib/types';

interface SettingsViewProps {
  activities: Activity[];
  onDataChange: () => void;
}

export function SettingsView({ activities, onDataChange }: SettingsViewProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPdfDate, setSelectedPdfDate] = useState(getDateString());

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeflow-backup-${getDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup downloaded');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as BackupData;
        if (confirm('This will replace all your current data. Continue?')) {
          importAllData(data);
          onDataChange();
          toast.success('Data imported successfully');
        }
      } catch (error) {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    clearAllData();
    onDataChange();
    setShowConfirmClear(false);
    toast.success('All data cleared');
    window.location.reload();
  };

  const handleDownloadPdf = () => {
    generateDailyPDF(selectedPdfDate);
    toast.success(`PDF report for ${formatDateDisplay(selectedPdfDate)} downloaded`);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Activity Management */}
      <section className="p-6 rounded-2xl bg-card border border-border shadow-card">
        <ActivityManager activities={activities} onUpdate={onDataChange} />
      </section>

      {/* PDF Export */}
      <section className="p-6 rounded-2xl bg-card border border-border shadow-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">PDF Reports</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Download a detailed PDF report for any day including time entries and habit progress.
        </p>
        
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedPdfDate}
            onChange={(e) => setSelectedPdfDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </section>

      {/* Data Backup */}
      <section className="p-6 rounded-2xl bg-card border border-border shadow-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Data Backup</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Export your data as JSON to keep a backup, or import a previous backup.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </section>

      {/* Danger Zone */}
      <section className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20">
        <h3 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h3>
        
        {!showConfirmClear ? (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">This action cannot be undone!</p>
                <p className="text-sm text-destructive/80">All your activities, time entries, habits, and logs will be permanently deleted.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
              >
                Yes, Delete Everything
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 rounded-lg bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
