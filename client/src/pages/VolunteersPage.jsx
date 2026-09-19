import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { volunteersApi } from '../api/volunteersApi';
import { useNotification } from '../context/NotificationContext';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  X,
  Loader2,
  Phone
} from 'lucide-react';

export const VolunteersPage = () => {
  const { currentEvent } = useEvent();
  const { addToast } = useNotification();

  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [searchCategory, setSearchCategory] = useState('');

  const [newVol, setNewVol] = useState({
    name: '',
    email: '',
    skills: 'Technical, Audio/Visual',
    availability: 'Full Day',
    maximumWorkload: 5
  });

  const loadVolunteers = async () => {
    if (!currentEvent?._id) return;
    setLoading(true);
    try {
      const res = await volunteersApi.getEventVolunteers(currentEvent._id);
      if (res.success) setVolunteers(res.volunteers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, [currentEvent?._id]);

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    try {
      const res = await volunteersApi.addVolunteer(currentEvent._id, newVol);
      if (res.success) {
        addToast('Volunteer Enrolled', `Added ${res.volunteer.name} to the team`, 'success');
        setShowAddModal(false);
        setNewVol({
          name: '',
          email: '',
          skills: 'Technical, Audio/Visual',
          availability: 'Full Day',
          maximumWorkload: 5
        });
        loadVolunteers();
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || err.message, 'error');
    }
  };

  const handleGetRecommendations = async (cat) => {
    setSearchCategory(cat);
    try {
      const res = await volunteersApi.getRecommendations(currentEvent._id, { category: cat });
      if (res.success) setRecommendations(res.recommendations);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 font-['Outfit']">
            Volunteer Operations & Workload
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor member capacity, prevent burnout, and find suitable task candidates.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Volunteer</span>
        </button>
      </div>

      {/* Intelligent Match Finder Banner */}
      <div className="p-4 rounded-2xl glass-card border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span className="font-semibold">Match by Skill:</span>
          <span>Click a category to find optimal assignees:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {['Registration', 'Technical', 'Hospitality', 'Design', 'Logistics'].map(cat => (
            <button
              key={cat}
              onClick={() => handleGetRecommendations(cat)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                searchCategory === cat
                  ? 'bg-brand-600 text-white border-brand-500 shadow-glow'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Results (if selected) */}
      {recommendations.length > 0 && (
        <div className="p-4 rounded-2xl bg-brand-950/40 border border-brand-500/30 space-y-2 animate-fade-in">
          <div className="text-xs font-bold text-brand-300 flex items-center justify-between">
            <span>Recommended Volunteers for "{searchCategory}"</span>
            <button onClick={() => setRecommendations([])} className="text-slate-400 hover:text-slate-200 text-xs">✕ Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((rec, i) => (
              <div key={i} className="p-3 rounded-xl bg-dark-950/80 border border-slate-800 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span>{rec.volunteer.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">
                    Score: {rec.score}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{rec.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volunteers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {volunteers.map(vol => {
          const isOverloaded = vol.currentWorkload >= vol.maximumWorkload;
          const percentage = Math.min(100, Math.round((vol.currentWorkload / vol.maximumWorkload) * 100));

          return (
            <div
              key={vol._id}
              className={`p-5 rounded-2xl glass-card border transition-all ${
                isOverloaded
                  ? 'border-rose-500/40 shadow-glow-rose bg-rose-950/10'
                  : 'border-slate-800 hover:border-brand-500/40'
              } space-y-4 text-xs`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{vol.name}</h3>
                  <div className="flex items-center space-x-1 text-slate-400 text-[11px] mt-0.5">
                    <Mail className="w-3 h-3" />
                    <span>{vol.email}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isOverloaded
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {isOverloaded ? 'OVERLOADED' : vol.status}
                </span>
              </div>

              {/* Workload Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Assigned Load</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {vol.currentWorkload} / {vol.maximumWorkload} tasks ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isOverloaded ? 'bg-rose-500' : percentage > 60 ? 'bg-amber-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Skills Badges */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Skills & Capabilities
                </div>
                <div className="flex flex-wrap gap-1">
                  {vol.skills?.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[10px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                <span>{vol.availability}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Volunteer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-panel bg-dark-900 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100">Add Team Volunteer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddVolunteer} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newVol.name}
                  onChange={(e) => setNewVol({ ...newVol, name: e.target.value })}
                  placeholder="e.g. Maya Lin"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newVol.email}
                  onChange={(e) => setNewVol({ ...newVol, email: e.target.value })}
                  placeholder="maya@college.edu"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={newVol.skills}
                  onChange={(e) => setNewVol({ ...newVol, skills: e.target.value })}
                  placeholder="Technical, Audio/Visual, Stage"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Availability</label>
                  <input
                    type="text"
                    value={newVol.availability}
                    onChange={(e) => setNewVol({ ...newVol, availability: e.target.value })}
                    placeholder="Full Day / Afternoons"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Max Tasks</label>
                  <input
                    type="number"
                    value={newVol.maximumWorkload}
                    onChange={(e) => setNewVol({ ...newVol, maximumWorkload: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-glow"
                >
                  Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
