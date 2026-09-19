import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { risksApi } from '../api/risksApi';
import { useNotification } from '../context/NotificationContext';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Play, 
  RefreshCw, 
  Loader2, 
  Plus,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const RisksPage = () => {
  const { currentEvent, refreshEventHealth } = useEvent();
  const { addToast } = useNotification();

  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newRisk, setNewRisk] = useState({
    title: '',
    description: '',
    severity: 'HIGH',
    recommendedAction: ''
  });

  const loadRisks = async () => {
    if (!currentEvent?._id) return;
    setLoading(true);
    try {
      const res = await risksApi.getEventRisks(currentEvent._id, { status: statusFilter });
      if (res.success) setRisks(res.risks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRisks();
  }, [currentEvent?._id, statusFilter]);

  const handleRunRiskEngine = async () => {
    setEvaluating(true);
    try {
      const res = await risksApi.evaluateRisks(currentEvent._id);
      if (res.success) {
        if (res.newlyDetectedCount > 0) {
          addToast('Risk Engine Alert', `Detected ${res.newlyDetectedCount} new operational vulnerabilities`, 'warning');
        } else {
          addToast('Risk Engine Passed', 'No new unflagged vulnerabilities detected', 'success');
        }
        await loadRisks();
        refreshEventHealth();
      }
    } catch (err) {
      addToast('Evaluation Error', err.message, 'error');
    } finally {
      setEvaluating(false);
    }
  };

  const handleResolveRisk = async (riskId) => {
    try {
      const res = await risksApi.resolveRisk(riskId);
      if (res.success) {
        addToast('Risk Resolved', `Resolved: "${res.risk.title}"`, 'success');
        setRisks(prev => prev.filter(r => r._id !== riskId));
        refreshEventHealth();
      }
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleCreateRisk = async (e) => {
    e.preventDefault();
    try {
      const res = await risksApi.createRisk(currentEvent._id, newRisk);
      if (res.success) {
        addToast('Risk Logged', `Added "${res.risk.title}"`, 'info');
        setShowAddModal(false);
        setNewRisk({ title: '', description: '', severity: 'HIGH', recommendedAction: '' });
        loadRisks();
        refreshEventHealth();
      }
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 font-['Outfit'] flex items-center space-x-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <span>Proactive Risk & Bottleneck Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Continuous deterministic evaluation of deadlines, volunteer overload, and task dependencies.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunRiskEngine}
            disabled={evaluating}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-semibold shadow-glow-rose disabled:opacity-50 transition-all"
          >
            {evaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Run Automated Risk Evaluation</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Risk</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs">
        <button
          onClick={() => setStatusFilter('OPEN')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
            statusFilter === 'OPEN'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Open Risks
        </button>
        <button
          onClick={() => setStatusFilter('RESOLVED')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
            statusFilter === 'RESOLVED'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Resolved Archive
        </button>
      </div>

      {/* Risks Grid */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          </div>
        ) : risks.length === 0 ? (
          <div className="p-12 rounded-2xl glass-card border border-slate-800 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-sm text-slate-200">No {statusFilter} Risks Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {statusFilter === 'OPEN'
                ? 'Your event operations are healthy. You can click "Run Automated Risk Evaluation" to rescan all tasks and volunteer capacities.'
                : 'No resolved risks recorded yet.'}
            </p>
          </div>
        ) : (
          risks.map(risk => {
            const isCritical = risk.severity === 'CRITICAL';
            const isHigh = risk.severity === 'HIGH';

            return (
              <div
                key={risk._id}
                className={`p-5 rounded-2xl glass-card border transition-all ${
                  isCritical
                    ? 'border-rose-500/50 bg-rose-950/15 shadow-glow-rose'
                    : isHigh
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800'
                } flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isCritical ? 'bg-rose-500 text-white' :
                      isHigh ? 'bg-amber-500 text-white' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {risk.severity} SEVERITY
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Source: {risk.source}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-100">{risk.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{risk.description}</p>

                  {risk.recommendedAction && (
                    <div className="p-2.5 rounded-xl bg-dark-950/70 border border-slate-800 text-[11px] text-brand-300 flex items-start space-x-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-slate-200">Recommended Remediation: </strong>
                        <span>{risk.recommendedAction}</span>
                      </div>
                    </div>
                  )}
                </div>

                {statusFilter === 'OPEN' && (
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleResolveRisk(risk._id)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-glow-emerald transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Manual Risk Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-panel bg-dark-900 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100">Log Operational Risk</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRisk} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Risk Title *</label>
                <input
                  type="text"
                  required
                  value={newRisk.title}
                  onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                  placeholder="e.g. Catering vendor contract unconfirmed"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Impact & Description *</label>
                <textarea
                  rows={3}
                  required
                  value={newRisk.description}
                  onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                  placeholder="Explain why this threatens the event execution..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Severity</label>
                <select
                  value={newRisk.severity}
                  onChange={(e) => setNewRisk({ ...newRisk, severity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Recommended Action</label>
                <input
                  type="text"
                  value={newRisk.recommendedAction}
                  onChange={(e) => setNewRisk({ ...newRisk, recommendedAction: e.target.value })}
                  placeholder="e.g. Call vendor manager directly by 2 PM"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
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
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-glow-rose"
                >
                  Record Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
