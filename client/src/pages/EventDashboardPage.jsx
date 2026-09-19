import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { tasksApi } from '../api/tasksApi';
import { volunteersApi } from '../api/volunteersApi';
import { risksApi } from '../api/risksApi';
import { activityApi } from '../api/activityApi';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  Sparkles, 
  ArrowUpRight, 
  Calendar, 
  RefreshCw,
  PlusCircle,
  Flame,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreateEventModal } from '../components/events/CreateEventModal';

export const EventDashboardPage = () => {
  const { currentEvent, eventHealth, healthLoading, refreshEventHealth } = useEvent();
  const { isOrganizer } = useAuth();

  const [todayTasks, setTodayTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [criticalRisks, setCriticalRisks] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingWidgets, setLoadingWidgets] = useState(false);

  useEffect(() => {
    const loadWidgets = async () => {
      if (!currentEvent?._id) return;
      setLoadingWidgets(true);
      try {
        const [tasksRes, volRes, risksRes, actRes] = await Promise.all([
          tasksApi.getEventTasks(currentEvent._id, { limit: 6 }),
          volunteersApi.getEventVolunteers(currentEvent._id),
          risksApi.getEventRisks(currentEvent._id, { status: 'OPEN' }),
          activityApi.getEventActivity(currentEvent._id, { limit: 8 })
        ]);

        if (tasksRes.success) setTodayTasks(tasksRes.tasks.slice(0, 5));
        if (volRes.success) setVolunteers(volRes.volunteers);
        if (risksRes.success) setCriticalRisks(risksRes.risks.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH'));
        if (actRes.success) setRecentActivities(actRes.activities);
      } catch (err) {
        console.error('Error loading dashboard widgets:', err);
      } finally {
        setLoadingWidgets(false);
      }
    };

    loadWidgets();
  }, [currentEvent?._id]);

  const [showLocalCreateModal, setShowLocalCreateModal] = useState(false);

  const handleTaskCheck = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      await tasksApi.updateTaskStatus(taskId, nextStatus);
      setTodayTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: nextStatus } : t));
      refreshEventHealth();
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentEvent) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-glow mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 font-['Outfit']">No Event Workspace Active</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Create an event workspace to unlock autonomous operations, volunteer capacity balancing, AI planning, and proactive risk detection.
            </p>
          </div>
          <button
            onClick={() => setShowLocalCreateModal(true)}
            className="w-full flex items-center justify-center space-x-2 py-3 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Your First Event</span>
          </button>
        </div>
        <CreateEventModal isOpen={showLocalCreateModal} onClose={() => setShowLocalCreateModal(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-100 font-['Outfit']">
              {currentEvent.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {currentEvent.status}
            </span>
          </div>
          <div className="flex items-center space-x-4 mt-1.5 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              <span>{new Date(currentEvent.eventDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </span>
            <span>•</span>
            <span>Venue: <strong className="text-slate-200">{currentEvent.venue}</strong></span>
            <span>•</span>
            <span>Expected: <strong className="text-slate-200">{currentEvent.expectedAudience} attendees</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshEventHealth}
            disabled={healthLoading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin text-brand-400' : ''}`} />
            <span>Sync Event State</span>
          </button>
          <Link
            to="/tasks"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
          >
            <span>Manage Tasks</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Fresh Event Kickstart Wizard */}
      {eventHealth?.tasks?.total === 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-950/80 via-dark-900 to-indigo-950/80 border border-brand-500/40 shadow-glow space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-brand-300 text-sm font-bold">
              <Sparkles className="w-5 h-5 text-brand-400 animate-pulse" />
              <span>Fresh Event Workspace Initialized — Let's Populate Your Plan!</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded border border-brand-500/30">
              AI Ready
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            This event currently has no tasks. You can use the AI Master Planner to synthesize 15-20 categorized deliverables in 5 seconds, ingest meeting notes, or auto-assign tasks to your team.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              to="/tasks"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-semibold text-xs shadow-glow transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate 15+ Tasks with AI Planner</span>
            </Link>
            <Link
              to="/meetings"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors"
            >
              <span>Ingest Meeting Transcript</span>
            </Link>
            <Link
              to="/volunteers"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors"
            >
              <span>Manage Team Roster</span>
            </Link>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Progress Ring Card */}
        <div className="p-4 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Progress</div>
            <div className="text-2xl font-black text-slate-100 mt-1">
              {eventHealth?.progressPercentage || 0}%
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
              {eventHealth?.tasks?.completed || 0} of {eventHealth?.tasks?.total || 0} tasks done
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-brand-500 border-r-brand-500 flex items-center justify-center font-bold text-xs text-brand-300">
            {eventHealth?.progressPercentage || 0}%
          </div>
        </div>

        {/* Tasks Overdue Card */}
        <div className="p-4 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overdue Tasks</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-1">
            {eventHealth?.tasks?.overdue || 0}
          </div>
          <div className="text-[11px] text-rose-400 font-medium mt-0.5">
            Requires immediate attention
          </div>
        </div>

        {/* Active Risks Card */}
        <div className="p-4 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Open Risks</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-1">
            {eventHealth?.risks?.openTotal || 0}
          </div>
          <div className="text-[11px] text-amber-400 font-medium mt-0.5">
            {eventHealth?.risks?.critical || 0} Critical • {eventHealth?.risks?.high || 0} High
          </div>
        </div>

        {/* Volunteers Workload Card */}
        <div className="p-4 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Team</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-1">
            {eventHealth?.volunteers?.total || 0}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
            {eventHealth?.volunteers?.overloaded || 0} at full capacity
          </div>
        </div>
      </div>

      {/* AI Natural Language Briefing Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-950/60 via-dark-900 to-indigo-950/50 border border-brand-500/30 shadow-glow relative overflow-hidden">
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-2.5 text-xs font-bold text-brand-300">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="tracking-wide uppercase">AI Operations Briefing</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Live Grounded Snapshot</span>
        </div>
        <p className="mt-2.5 text-xs md:text-sm text-slate-200 leading-relaxed font-normal relative z-10">
          {eventHealth?.summary || 'Analyzing live event operations telemetry...'}
        </p>
      </div>

      {/* Critical Risks Alert Banner (if any exist) */}
      {criticalRisks.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 shadow-glow-rose space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>CRITICAL OPERATIONAL BOTTLENECKS DETECTED</span>
            </div>
            <Link to="/risks" className="text-xs text-rose-300 hover:text-rose-200 font-semibold flex items-center space-x-1">
              <span>View all risks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalRisks.slice(0, 2).map(r => (
              <div key={r._id} className="p-3 rounded-xl bg-dark-950/70 border border-rose-500/20 text-xs">
                <div className="font-bold text-slate-200 flex items-center justify-between">
                  <span>{r.title}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    {r.severity}
                  </span>
                </div>
                <div className="text-slate-400 mt-1 text-[11px]">{r.description}</div>
                {r.recommendedAction && (
                  <div className="mt-2 text-[11px] text-brand-300 bg-brand-950/40 p-2 rounded-lg border border-brand-500/20">
                    💡 <span className="font-semibold">AI Recommendation:</span> {r.recommendedAction}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column Operational Grid: Today's Tasks & Volunteer Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Key Tasks */}
        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="font-bold text-sm text-slate-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Current Deliverables</span>
            </div>
            <Link to="/tasks" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
              View All Tasks →
            </Link>
          </div>

          <div className="space-y-2.5">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No tasks created yet.</div>
            ) : (
              todayTasks.map(task => {
                const isOverdue = task.status !== 'COMPLETED' && new Date(task.deadline) < new Date();
                return (
                  <div
                    key={task._id}
                    className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 flex items-center justify-between transition-colors text-xs"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                      <button
                        onClick={() => handleTaskCheck(task._id, task.status)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-600 hover:border-brand-400'
                        }`}
                      >
                        {task.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <div className="truncate">
                        <div className={`font-medium truncate ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                          {task.title}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span>{task.category}</span>
                          <span>•</span>
                          <span>Assigned: <strong className="text-slate-300">{task.assignedVolunteerName}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          OVERDUE
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        task.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                        task.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Volunteer Capacity & Workload Balance */}
        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="font-bold text-sm text-slate-200 flex items-center space-x-2">
              <Users className="w-4 h-4 text-brand-400" />
              <span>Volunteer Workload Monitor</span>
            </div>
            <Link to="/volunteers" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
              Roster & Skills →
            </Link>
          </div>

          <div className="space-y-3">
            {volunteers.map(vol => {
              const percentage = Math.min(100, Math.round((vol.currentWorkload / vol.maximumWorkload) * 100));
              const isOverloaded = vol.currentWorkload >= vol.maximumWorkload;
              return (
                <div key={vol._id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-200">{vol.name}</span>
                      {isOverloaded && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          FULL CAPACITY
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-300 font-bold">
                      {vol.currentWorkload} / {vol.maximumWorkload} tasks
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverloaded
                          ? 'bg-rose-500'
                          : percentage > 60
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-brand-500 to-indigo-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 overflow-hidden truncate">
                    <span>Skills:</span>
                    {vol.skills?.slice(0, 3).map((s, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Operational Activity Timeline */}
      <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="font-bold text-sm text-slate-200 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Audit Trail & Activity Timeline</span>
          </div>
          <Link to="/activity" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
            Full Audit Log →
          </Link>
        </div>

        <div className="space-y-2 text-xs">
          {recentActivities.map(act => (
            <div key={act._id} className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-900/60 transition-colors">
              <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-200">{act.userName}: </span>
                <span className="text-slate-300">{act.details}</span>
              </div>
              <span className="text-[11px] text-slate-400 flex-shrink-0 font-mono">
                {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
