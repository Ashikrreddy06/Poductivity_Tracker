import { useState } from 'react';
import { Activity, DEFAULT_COLORS } from '@/lib/types';
import { addActivity, updateActivity, deleteActivity } from '@/lib/storage';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActivityManagerProps {
  activities: Activity[];
  onUpdate: () => void;
}

export function ActivityManager({ activities, onUpdate }: ActivityManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [error, setError] = useState('');

  const validateName = (name: string, excludeId?: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return 'Name cannot be empty';
    
    const duplicate = activities.find(
      a => a.name.toLowerCase() === trimmed.toLowerCase() && a.id !== excludeId
    );
    if (duplicate) return 'Activity already exists';
    
    return null;
  };

  const handleAdd = () => {
    const validationError = validateName(newName);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    addActivity({ name: newName.trim(), color: newColor });
    setNewName('');
    setNewColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
    setIsAdding(false);
    setError('');
    onUpdate();
    toast.success('Activity added');
  };

  const handleEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setEditName(activity.name);
    setEditColor(activity.color);
    setError('');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    
    const validationError = validateName(editName, editingId);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    updateActivity(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
    setError('');
    onUpdate();
    toast.success('Activity updated');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this activity? Time entries using it will keep their data.')) {
      deleteActivity(id);
      onUpdate();
      toast.success('Activity deleted');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Activities</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        )}
      </div>

      {/* Add new activity form */}
      {isAdding && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-3 animate-fade-in">
          <input
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setError('');
            }}
            placeholder="Activity name"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          
          <div className="flex gap-2 flex-wrap">
            {DEFAULT_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className={cn(
                  "w-8 h-8 rounded-full transition-transform",
                  newColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          
          {error && <p className="text-sm text-destructive">{error}</p>}
          
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              <Check className="w-4 h-4" />
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewName('');
                setError('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Activity list */}
      <div className="space-y-2">
        {activities.map(activity => (
          <div 
            key={activity.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border group"
          >
            {editingId === activity.id ? (
              <>
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: editColor }}
                />
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setError('');
                  }}
                  className="flex-1 px-2 py-1 rounded bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
                <div className="flex gap-1">
                  {DEFAULT_COLORS.slice(0, 5).map(color => (
                    <button
                      key={color}
                      onClick={() => setEditColor(color)}
                      className={cn(
                        "w-5 h-5 rounded-full transition-transform",
                        editColor === color && "ring-1 ring-offset-1 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button onClick={handleSaveEdit} className="p-1 hover:bg-muted rounded">
                  <Check className="w-4 h-4 text-primary" />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1 hover:bg-muted rounded">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </>
            ) : (
              <>
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activity.color }}
                />
                <span className="flex-1 text-foreground">{activity.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(activity)}
                    className="p-1.5 hover:bg-muted rounded-md"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button 
                    onClick={() => handleDelete(activity.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded-md"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {error && editingId && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
