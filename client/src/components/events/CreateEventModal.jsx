import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { useNotification } from '../../context/NotificationContext';
import { X, Calendar, MapPin, Users, Clock, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CreateEventModal = ({ isOpen, onClose }) => {
  const { createAndSelectEvent } = useEvent();
  const { addToast } = useNotification();
  const [loading, setLoading] = useState(false);

  // Set default eventDate to 7 days from now formatted as YYYY-MM-DD
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue: '',
    eventDate: getDefaultDate(),
    startTime: '09:00',
    endTime: '18:00',
    expectedAudience: 300,
    importClubVolunteers: true
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newEv = await createAndSelectEvent(formData);
      confetti({ particleCount: 90, spread: 70 });
      addToast('Event Initialized', `Successfully scheduled "${newEv.name}" with operations roster!`, 'success');
      onClose();
    } catch (err) {
      addToast('Error Creating Event', err.response?.data?.message || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const prefillSample = () => {
    setFormData({
      name: 'HackAI Summit 2026',
      description: 'Annual flagship artificial intelligence hackathon and workshop series.',
      venue: 'University Tech Innovation Center, Hall A',
      eventDate: getDefaultDate(),
      startTime: '09:30',
      endTime: '19:00',
      expectedAudience: 450,
      importClubVolunteers: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl glass-panel bg-dark-900 border border-slate-800 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-brand-400" />
            <span>Create New Operational Event</span>
          </h3>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={prefillSample}
              className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20 flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Fill Sample</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Event Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. AI Hackathon 2026, National Tech Summit"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Brief Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Summary of objectives, theme, and team structure"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>Venue *</span>
              </label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Main Auditorium, Hall B"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                <span>Event Date *</span>
              </label>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Expected Audience</label>
              <input
                type="number"
                value={formData.expectedAudience}
                onChange={(e) => setFormData({ ...formData, expectedAudience: parseInt(e.target.value, 10) || 100 })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.importClubVolunteers}
                onChange={(e) => setFormData({ ...formData, importClubVolunteers: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-slate-200">
                Pre-populate club volunteer team roster
              </span>
            </label>
            <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
              Enrolls Rahul, Priya, Amit, Neha, and Karan with clean capacity so tasks can be assigned and balanced right away.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold shadow-glow disabled:opacity-50 transition-all"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Launch Event Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
