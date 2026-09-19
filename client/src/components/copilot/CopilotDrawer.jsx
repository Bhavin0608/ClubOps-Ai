import React, { useState, useRef, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { useNotification } from '../../context/NotificationContext';
import { aiApi } from '../../api/aiApi';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const CopilotDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your ClubOps Operations Agent. I am monitoring your event in real-time. How can I assist with tasks, assignments, or risks today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState(null);

  const { selectedEventId, refreshEventHealth, currentEvent } = useEvent();
  const { addToast } = useNotification();
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    'What needs my attention today?',
    'Assign the pending registration task to the most suitable volunteer',
    'What are the critical risks right now?',
    'Contact keynote speaker to confirm attendance'
  ];

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || !selectedEventId) return;

    const userMsg = { role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await aiApi.copilotChat(selectedEventId, query);
      if (res.success) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: res.reply,
            proposedAction: res.proposedAction
          }
        ]);
      }
    } catch (err) {
      console.error('[Copilot Error]', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'I encountered an issue querying the operations database. Please try again.',
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAction = async (actionId) => {
    try {
      setExecutingActionId(actionId);
      const res = await aiApi.approveAction(actionId);
      if (res.success) {
        // Fire confetti celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 }
        });

        addToast('Action Executed', res.message, 'success');

        // Update local message proposedAction state to EXECUTED
        setMessages(prev =>
          prev.map(m =>
            m.proposedAction?._id === actionId
              ? {
                  ...m,
                  proposedAction: { ...m.proposedAction, status: 'EXECUTED', executionResult: res.result }
                }
              : m
          )
        );

        // Refresh global state
        refreshEventHealth();
      }
    } catch (err) {
      addToast('Execution Failed', err.response?.data?.message || err.message, 'error');
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleRejectAction = async (actionId) => {
    try {
      setExecutingActionId(actionId);
      const res = await aiApi.rejectAction(actionId, 'Declined by organizer in chat');
      if (res.success) {
        addToast('Action Dismissed', 'Proposed operation was rejected', 'info');
        setMessages(prev =>
          prev.map(m =>
            m.proposedAction?._id === actionId
              ? { ...m.proposedAction, status: 'REJECTED' }
              : m
          )
        );
      }
    } catch (err) {
      addToast('Error', err.message, 'error');
    } finally {
      setExecutingActionId(null);
    }
  };

  return (
    <>
      {/* Floating Action Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 text-white font-semibold shadow-glow hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-dark-950" />
          </div>
          <span className="text-sm tracking-wide font-['Outfit']">AI Copilot</span>
        </button>
      )}

      {/* Sliding Copilot Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] glass-panel bg-dark-950/95 border-l border-slate-800 shadow-2xl flex flex-col animate-slide-left">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-dark-900/60">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center shadow-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                  <span>ClubOps AI Copilot</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">
                    Live
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  Scoped to: {currentEvent?.name || 'Active Event'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none shadow-glow'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-lg'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Render Interactive Action Preview Card if AI formulated an action */}
                  {msg.proposedAction && (
                    <div className="mt-3 p-3 rounded-xl bg-dark-950/80 border border-brand-500/40 shadow-xl space-y-2.5 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-brand-300">
                          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                          <span>AI ACTION PROPOSAL</span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          msg.proposedAction.status === 'EXECUTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : msg.proposedAction.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {msg.proposedAction.status}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-100 text-xs">
                        {msg.proposedAction.description}
                      </div>

                      {msg.proposedAction.reason && (
                        <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          💡 <span className="text-slate-300 font-medium">Why:</span> {msg.proposedAction.reason}
                        </div>
                      )}

                      {/* Action Approval Buttons */}
                      {msg.proposedAction.status === 'PROPOSED' ? (
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={() => handleApproveAction(msg.proposedAction._id)}
                            disabled={executingActionId === msg.proposedAction._id}
                            className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-glow-emerald transition-all disabled:opacity-50"
                          >
                            {executingActionId === msg.proposedAction._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Approve & Execute</span>
                          </button>
                          <button
                            onClick={() => handleRejectAction(msg.proposedAction._id)}
                            disabled={executingActionId === msg.proposedAction._id}
                            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : msg.proposedAction.status === 'EXECUTED' ? (
                        <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-semibold pt-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Successfully mutated live database & notified team</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic pt-1">
                          Action proposal was declined.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-2xl w-fit border border-slate-800">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                <span>ClubOps AI is reasoning with event state...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="p-3 border-t border-slate-800/60 bg-dark-900/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Quick Suggestions
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp)}
                  className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-brand-600/30 border border-slate-700/60 text-slate-300 hover:text-brand-200 transition-colors truncate max-w-full"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-800 bg-dark-900/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask or give operational instruction..."
                className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 shadow-glow transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
