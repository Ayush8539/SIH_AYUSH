import React from 'react';
import { useAlerts } from '@/components/alerts/AlertProvider';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Bell,
  AlertTriangle,
  BarChart2,
  Users,
  Map,
  FileText,
  Settings,
  X,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { alerts } = useAlerts();

  const navItems: NavItem[] = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Live Cameras', to: '/live', icon: Video },
    { label: 'Alerts', to: '/detections', icon: AlertTriangle, badge: alerts.length > 0 ? alerts.length : 3, badgeColor: 'bg-amber-500 text-slate-900' },
    { label: 'Incidents', to: '/incidents', icon: Bell, badge: 1, badgeColor: 'bg-rose-600 text-white' },
    { label: 'Analytics', to: '/analytics', icon: BarChart2 },
    { label: 'Watchlist', to: '/watchlist', icon: Users },
    { label: 'Border Map', to: '/zones', icon: Map },
    { label: 'Reports', to: '/reports', icon: FileText },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-60 bg-slate-900 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-xl select-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo Top */}
        <div className="h-18 px-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black tracking-wider text-lg text-white font-sans">
                IBVAP
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-none">
                Border Command
              </div>
            </div>
          </NavLink>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            aria-label="Close sidebar navigation"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Surveillance Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    <span className="flex-1 truncate tracking-wide">{item.label}</span>

                    {item.badge !== undefined && (
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.2 min-w-[18px] text-center rounded-full shadow-xs', item.badgeColor || 'bg-blue-500 text-white')}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 text-center">
          <div className="text-[11px] font-bold text-slate-300 tracking-wide">
            Sector-7 Security Grid
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            AI Engine: YOLOv8n + ReID + ByteTrack
          </div>
        </div>
      </aside>
    </>
  );
};
