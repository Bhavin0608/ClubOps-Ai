import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  FileAudio, 
  AlertTriangle, 
  FolderOpen, 
  Clock, 
  Activity,
  Flame,
  CalendarDays
} from 'lucide-react';
import { useEvent } from '../../context/EventContext';

export const Sidebar = () => {
  const { currentEvent, eventHealth } = useEvent();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks Board', path: '/tasks', icon: CheckSquare, badge: eventHealth?.tasks?.total },
    { name: 'Volunteers', path: '/volunteers', icon: Users, badge: eventHealth?.volunteers?.total },
    { name: 'Meetings & AI', path: '/meetings', icon: FileAudio, badge: eventHealth?.meetingsCount },
    { 
      name: 'Risks & Alerts', 
      path: '/risks', 
      icon: AlertTriangle, 
      badge: eventHealth?.risks?.openTotal,
      badgeColor: eventHealth?.risks?.critical > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500/20 text-amber-300'
    },
    { name: 'Documents', path: '/documents', icon: FolderOpen },
    { name: 'Activity Log', path: '/activity', icon: Clock }
  ];

  // Calculate days remaining
  const daysLeft = currentEvent ? Math.ceil((new Date(currentEvent.eventDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-dark-950/60 backdrop-blur-xl flex flex-col justify-between py-6 px-4">
      <div className="space-y-6">
        {/* Navigation list */}
        <nav className="space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600/30 to-brand-600/10 text-brand-300 border border-brand-500/30 shadow-glow font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Live Event Snapshot Card */}
      {currentEvent && (
        <div className="p-4 rounded-xl glass-card border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
              <Activity className="w-3.5 h-3.5 text-brand-400" />
              <span>Event Readiness</span>
            </div>
            <span className="text-[11px] font-bold text-brand-400">
              {eventHealth?.progressPercentage || 0}%
            </span>
          </div>

          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${eventHealth?.progressPercentage || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
            <div className="flex items-center space-x-1.5">
              <CalendarDays className="w-3 h-3 text-slate-400" />
              <span>{daysLeft > 0 ? `${daysLeft} days to go` : 'Event Day!'}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
              {currentEvent.status}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
