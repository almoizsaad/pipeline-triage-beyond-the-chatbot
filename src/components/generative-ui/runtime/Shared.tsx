import { useState, type ReactNode } from 'react';
import { Info, AlertCircle, Pencil } from 'lucide-react';

export function CardSkeleton() {
  return (
    <div className="nexus-card p-4 space-y-3 animate-pulse">
      <div className="h-4 rounded w-2/3" style={{ background: '#E7E5E4' }} />
      <div className="h-20 rounded-lg" style={{ background: '#FAF9F6' }} />
      <div className="h-3 rounded w-1/2" style={{ background: '#E7E5E4' }} />
    </div>
  );
}

export function EmptyState({ title }: { title: string }) {
  return (
    <div className="nexus-card p-6 text-center">
      <Info className="w-8 h-8 mx-auto mb-2" style={{ color: '#A8A29E' }} />
      <h3 className="text-sm font-medium mb-1" style={{ color: '#78716C' }}>{title}</h3>
      <p className="text-xs" style={{ color: '#A8A29E' }}>No data available yet</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="nexus-card p-6 text-center" style={{ borderColor: '#FECACA' }}>
      <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#991B1B' }} />
      <h3 className="text-sm font-medium mb-1" style={{ color: '#991B1B' }}>Something went wrong</h3>
      <p className="text-xs mb-3" style={{ color: '#78716C' }}>{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="nexus-btn nexus-btn-primary text-xs"
          style={{ padding: '0.375rem 0.75rem' }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EditableCard({ children, title, onSave }: { children: ReactNode; title?: string; onSave?: (val: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title || '');

  if (isEditing) {
    return (
      <div
        className="nexus-card p-4"
        style={{ borderColor: '#BE123C', borderWidth: '2px' }}
      >
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full bg-transparent outline-none resize-none text-sm"
          style={{ color: '#292524', fontFamily: 'Inter, sans-serif' }}
          rows={3}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              onSave?.(editValue);
              setIsEditing(false);
            }}
            className="nexus-btn nexus-btn-primary"
            style={{ padding: '0.375rem 0.75rem', fontSize: '12px' }}
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="nexus-btn nexus-btn-secondary"
            style={{ padding: '0.375rem 0.75rem', fontSize: '12px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative h-full"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
      style={{ cursor: 'pointer' }}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ background: '#FAF9F6', border: '1px solid #E7E5E4' }}
        >
          <Pencil className="w-3 h-3" style={{ color: '#78716C' }} />
        </div>
      </div>
      {children}
    </div>
  );
}
