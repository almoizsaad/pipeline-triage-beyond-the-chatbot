import { useState } from 'react';
import {
  Code2, Palette, BarChart3, Globe,
  Database, Cpu, ChevronRight, Activity, CircleDot,
  Trash2, AlertTriangle, AlertCircle, Info, Bug
} from 'lucide-react';
import type { LogEntry, LogLevel } from '@/stores/logStore';

interface SidebarProps {
  activeModule?: string;
  onModuleChange?: (module: string) => void;
  logEntries?: LogEntry[];
  filterLevel?: LogLevel | 'all';
  onFilterChange?: (level: LogLevel | 'all') => void;
  onClearLog?: () => void;
}

const MODULES = [
  { id: 'analysis', label: 'Analysis', icon: BarChart3, color: '#BE123C', desc: 'Neural data processing' },
  { id: 'code', label: 'Code', icon: Code2, color: '#0F766E', desc: 'Binary synthesis & scripts' },
  { id: 'creative', label: 'Creative', icon: Palette, color: '#B45309', desc: 'Generative ideation' },
  { id: 'travel', label: 'Travel', icon: Globe, color: '#15803D', desc: 'Geospatial mission logic' },
  { id: 'data', label: 'Data', icon: Database, color: '#44403C', desc: 'Vector memory management' },
];

const LOG_FILTERS: { label: string; value: LogLevel | 'all'; color: string }[] = [
  { label: 'All', value: 'all', color: '#78716C' },
  { label: 'Info', value: 'info', color: '#15803D' },
  { label: 'Warn', value: 'warn', color: '#B45309' },
  { label: 'Error', value: 'error', color: '#991B1B' },
  { label: 'Debug', value: 'debug', color: '#0F766E' },
];

const LOG_ICONS: Record<LogLevel, typeof Info> = {
  info: Info,
  warn: AlertCircle,
  error: AlertTriangle,
  debug: Bug,
};

const LOG_COLORS: Record<LogLevel, string> = {
  info: '#15803D',
  warn: '#B45309',
  error: '#991B1B',
  debug: '#0F766E',
};

export default function Sidebar({
  activeModule = 'travel',
  onModuleChange,
  logEntries = [],
  filterLevel = 'all',
  onFilterChange,
  onClearLog,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showLog, setShowLog] = useState(true);

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? 56 : 240,
        minWidth: collapsed ? 56 : 240,
        background: '#FAF9F6',
        borderRight: '1px solid #E7E5E4',
      }}
      aria-label="Sidebar navigation"
    >
      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-inset"
        style={{ borderBottom: '1px solid #E7E5E4', color: '#78716C' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#292524'; e.currentTarget.style.background = '#FDFCF8'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#78716C'; e.currentTarget.style.background = 'transparent'; }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      {/* Core Modules */}
      <div className="flex-1 overflow-y-auto py-2">
        <div
          className={`nexus-label mb-2 ${collapsed ? 'text-center px-0' : 'px-4'}`}
          style={{ fontSize: 10 }}
        >
          {collapsed ? 'Sys' : 'Sub-Systems'}
        </div>
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => onModuleChange?.(mod.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-inset ${collapsed ? 'justify-center' : ''}`}
              style={{
                color: isActive ? '#292524' : '#78716C',
                background: isActive ? '#FDFCF8' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) { e.currentTarget.style.color = '#292524'; e.currentTarget.style.background = '#FDFCF8'; }
              }}
              onMouseLeave={(e) => {
                if (!isActive) { e.currentTarget.style.color = '#78716C'; e.currentTarget.style.background = 'transparent'; }
              }}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? mod.label : mod.desc}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                  style={{ background: mod.color }}
                />
              )}
              <Icon className="w-[18px] h-[18px] flex-shrink-0" style={{ color: isActive ? mod.color : undefined }} />
              {!collapsed && <span className="font-medium truncate">{mod.label}</span>}
              {!collapsed && isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: mod.color }} />
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div className="my-3 mx-3 h-px" style={{ background: '#E7E5E4' }} />

        {/* System Status */}
        <div className={`nexus-label mb-2 ${collapsed ? 'text-center px-0' : 'px-4'}`} style={{ fontSize: 10 }}>
          {collapsed ? 'Sys' : 'System'}
        </div>
        <button
          className={`w-full flex items-center gap-3 px-3 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-inset ${collapsed ? 'justify-center' : ''}`}
          style={{ color: '#78716C' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#292524'; e.currentTarget.style.background = '#FDFCF8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#78716C'; e.currentTarget.style.background = 'transparent'; }}
          title="Neural Core Status"
        >
          <Cpu className="w-[18px] h-[18px]" />
          {!collapsed && <span className="text-sm">Neural Core</span>}
        </button>
        <button
          className={`w-full flex items-center gap-3 px-3 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-inset ${collapsed ? 'justify-center' : ''}`}
          style={{ color: '#78716C' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#292524'; e.currentTarget.style.background = '#FDFCF8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#78716C'; e.currentTarget.style.background = 'transparent'; }}
          title="Live System Metrics"
        >
          <Activity className="w-[18px] h-[18px]" />
          {!collapsed && <span className="text-sm">Live Metrics</span>}
        </button>
      </div>

      {/* System Log */}
      {!collapsed && (
        <div className="flex flex-col" style={{ borderTop: '1px solid #E7E5E4', maxHeight: '45%' }}>
          {/* Log Header */}
          <button
            onClick={() => setShowLog(!showLog)}
            className="w-full flex items-center justify-between px-4 py-2 nexus-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-inset"
            style={{ fontSize: 10 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#78716C'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#A8A29E'; }}
            aria-expanded={showLog}
          >
            <div className="flex items-center gap-2">
              <span>System Log</span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: '#E7E5E4', color: '#78716C' }}
              >
                {logEntries.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CircleDot className="w-3 h-3" style={{ color: '#15803D' }} />
              <ChevronRight className={`w-3 h-3 transition-transform ${showLog ? 'rotate-90' : ''}`} style={{ color: '#A8A29E' }} />
            </div>
          </button>

          {showLog && (
            <>
              {/* Filter Bar */}
              <div className="flex items-center gap-1 px-3 pb-2">
                {LOG_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => onFilterChange?.(f.value)}
                    className="text-[9px] px-1.5 py-0.5 rounded transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#BE123C]"
                    style={{
                      background: filterLevel === f.value ? `${f.color}15` : 'transparent',
                      color: filterLevel === f.value ? f.color : '#A8A29E',
                      fontWeight: filterLevel === f.value ? 600 : 400,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  onClick={() => onClearLog?.()}
                  className="p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#BE123C]"
                  style={{ color: '#A8A29E' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#991B1B'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#A8A29E'; }}
                  title="Clear log"
                  aria-label="Clear log"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Log Entries */}
              <div
                className="px-3 pb-3 overflow-y-auto flex-1"
                role="log"
                aria-live="polite"
                aria-label="System log"
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  maxHeight: '200px',
                  minHeight: '100px',
                }}
              >
                {logEntries.length === 0 && (
                  <div style={{ color: '#A8A29E' }} className="text-[10px] italic py-2">
                    No log entries...
                  </div>
                )}
                <div className="space-y-1.5">
                  {logEntries.map((entry) => {
                    const LogIcon = LOG_ICONS[entry.level];
                    const logColor = LOG_COLORS[entry.level];
                    return (
                      <div
                        key={entry.id}
                        className="text-[10px] leading-relaxed"
                        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                      >
                        <div className="flex items-start gap-1.5">
                          <LogIcon className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" style={{ color: logColor }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span style={{ color: '#A8A29E' }} className="flex-shrink-0">
                                {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                                  hour12: false,
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                              <span
                                className="text-[9px] px-1 rounded"
                                style={{
                                  background: `${logColor}15`,
                                  color: logColor,
                                  fontWeight: 500,
                                }}
                              >
                                {entry.source}
                              </span>
                            </div>
                            <div style={{ color: '#78716C' }} className="mt-0.5">
                              {entry.message}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
