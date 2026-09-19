import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/axiosInstance';
import { FolderOpen, Plus, FileText, X, Loader2 } from 'lucide-react';

export const DocumentsPage = () => {
  const { currentEvent } = useEvent();
  const { addToast } = useNotification();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'Guidelines',
    content: ''
  });

  const loadDocuments = async () => {
    if (!currentEvent?._id) return;
    setLoading(true);
    try {
      const res = await api.get(`/events/${currentEvent._id}/documents`);
      if (res.data.success) setDocuments(res.data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [currentEvent?._id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/events/${currentEvent._id}/documents`, docForm);
      if (res.data.success) {
        addToast('Document Uploaded', `Saved "${res.data.document.title}"`, 'success');
        setShowModal(false);
        setDocForm({ title: '', category: 'Guidelines', content: '' });
        loadDocuments();
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 font-['Outfit']">
            Operational Knowledge & Documents
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Guidelines, sponsor agreements, and briefing documents accessible to the AI.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {documents.map(doc => (
          <div key={doc._id} className="p-5 rounded-2xl glass-card border border-slate-800 space-y-3 text-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-brand-400" />
                <span className="font-bold text-sm text-slate-200">{doc.title}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                {doc.category}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] text-slate-400 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {doc.content || 'No text preview available.'}
            </div>
            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
              <span>Uploaded by {doc.uploadedBy?.name || 'Organizer'}</span>
              <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-panel bg-dark-900 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100">Upload Operational Document</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="e.g. Venue Guidelines & Layout Map"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={docForm.category}
                  onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                >
                  <option value="Guidelines">Guidelines</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Sponsorship">Sponsorship</option>
                  <option value="Budget">Budget</option>
                  <option value="Technical">Technical</option>
                  <option value="Schedule">Schedule</option>
                  <option value="Report">Report</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Document Content / Text *</label>
                <textarea
                  rows={5}
                  required
                  value={docForm.content}
                  onChange={(e) => setDocForm({ ...docForm, content: e.target.value })}
                  placeholder="Paste document text..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px] focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-glow"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
