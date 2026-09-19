import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { activityApi } from '../api/notificationsApi';
import { Clock, Filter, Activity, Sparkles } from 'lucide-react';

export const ActivityLogPage = () => {
  const { currentEvent } = useEvent();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadActivities = async () => {
    if (!currentEvent?._id) return;
    setLoading(true);
    try {
      const res = await activityApi.getEventActivity(currentEvent._id, {
        category: categoryFilter || undefined,
        limit: 50
      });
      if (res.success) setActivities(res.activities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [currentEvent?._id, categoryFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 font-['Outfit'] flex items-center space-x-2.5">
            <Clock className="w-6 h-6 text-brand-400" />
            <span>Audit Trail & Activity Log</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete, chronological history of all human and AI operational actions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="TASK">Tasks</option>
            <option value="AI_ACTION">AI Actions</option>
            <option value="MEETING">Meetings</option>
            <option value="RISK">Risks</option>
            <option value="VOLUNTEER">Volunteers</option>
            <option value="EVENT">Event</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl glass-card border border-slate-800 p-5 space-y-3 text-xs">
        {activities.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No activity recorded for this filter.</div>
        ) : (
          activities.map((act) => {
            const isAi = act.category === 'AI_ACTION' || act.userName.includes('AI');
            return (
              <div
                key={act._id}
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-4 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isAi
                        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-glow'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isAi ? <Sparkles className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200">{act.userName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {act.action}
                      </span>
                    </div>
                    <div className="text-slate-300 mt-1">{act.details}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end flex-shrink-0 text-[11px] text-slate-400 font-mono">
                  <span>{new Date(act.createdAt).toLocaleDateString()}</span>
                  <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
