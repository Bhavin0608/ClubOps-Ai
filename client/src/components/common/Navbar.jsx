import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEvent } from '../../context/EventContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  Bell, 
  Calendar, 
  ChevronDown, 
  LogOut, 
  Plus, 
  Sparkles, 
  CheckCheck,
  ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = ({ onOpenCreateEvent }) => {
  const { user, logout, isOrganizer } = useAuth();
  const { events, selectedEventId, selectEvent, currentEvent } = useEvent();
  const { notifications, unreadCount, markRead, markAllRead } = useNotification();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showEventSelect, setShowEventSelect] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-dark-950/80 backdrop-blur-xl px-6 flex items-center justify-between">
      {/* Brand Title / Logo */}
      <div className="flex items-center space-x-6">
        <Link to="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg tracking-tight gradient-text font-['Outfit']">ClubOps AI</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Agent v2.0
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium -mt-0.5">Autonomous Event Operations</div>
          </div>
        </Link>

        {/* Event Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowEventSelect(!showEventSelect)}
            className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-medium text-slate-200 transition-colors"
          >
            <Calendar className="w-4 h-4 text-brand-400" />
            <span className="max-w-[200px] truncate">{currentEvent?.name || 'Select Event'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showEventSelect && (
            <div className="absolute left-0 mt-2 w-72 rounded-xl glass-panel shadow-2xl p-1.5 z-50 animate-fade-in border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                Select Active Event
              </div>
              <div className="max-h-56 overflow-y-auto space-y-0.5 mt-1">
                {events.map((ev) => (
                  <button
                    key={ev._id}
                    onClick={() => {
                      selectEvent(ev._id);
                      setShowEventSelect(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      ev._id === selectedEventId
                        ? 'bg-brand-600/20 text-brand-300 font-medium'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate">{ev.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ev.eventDate).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
              <div className="pt-1.5 mt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowEventSelect(false);
                    if (onOpenCreateEvent) onOpenCreateEvent();
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Event</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Direct New Event Quick Button */}
        <button
          onClick={onOpenCreateEvent}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow transition-all"
          title="Create a new event workspace"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Event</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl glass-panel shadow-2xl p-3 z-50 border border-slate-800 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <div className="font-semibold text-sm text-slate-200">Notifications</div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">No recent notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markRead(n._id)}
                      className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        n.isRead ? 'bg-slate-900/40 text-slate-400' : 'bg-brand-950/40 border border-brand-500/20 text-slate-200'
                      }`}
                    >
                      <div className="font-medium text-slate-200">{n.title}</div>
                      <div className="mt-0.5 text-slate-400">{n.message}</div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-200">{user?.name}</div>
            <div className="text-[11px] text-brand-400 font-medium flex items-center justify-end space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{user?.role}</span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
