import React, { useState, useEffect, useMemo } from 'react';
import { useEvent } from '../context/EventContext';
import { tasksApi } from '../api/tasksApi';
import { volunteersApi } from '../api/volunteersApi';
import { aiApi } from '../api/aiApi';
import { useNotification } from '../context/NotificationContext';
import { 
  Plus, 
  Sparkles, 
  Filter, 
  Kanban, 
  Table as TableIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  Trash2,
  Loader2,
  X,
  Search,
  Edit3,
  Bot,
  Flame,
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const TasksPage = () => {
  const { currentEvent, refreshEventHealth } = useEvent();
  const { addToast } = useNotification();

  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('ALL'); // 'ALL', 'UNASSIGNED', 'OVERDUE', 'CRITICAL'
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  // Modals & State
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showAiPlanModal, setShowAiPlanModal] = useState(false);
  const [aiGeneratedTasks, setAiGeneratedTasks] = useState([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  // Task Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'Logistics',
    priority: 'MEDIUM',
    status: 'TODO',
    deadline: '',
    assignedTo: '',
    dependencies: []
  });

  const loadTasksAndVolunteers = async () => {
    if (!currentEvent?._id) return;
    setLoading(true);
    try {
      const [tRes, vRes] = await Promise.all([
        tasksApi.getEventTasks(currentEvent._id),
        volunteersApi.getEventVolunteers(currentEvent._id)
      ]);
      if (tRes.success) setTasks(tRes.tasks);
      if (vRes.success) setVolunteers(vRes.volunteers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasksAndVolunteers();
  }, [currentEvent?._id]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingTaskId(null);
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    setTaskForm({
      title: '',
      description: '',
      category: 'Logistics',
      priority: 'MEDIUM',
      status: 'TODO',
      deadline: defaultDate.toISOString().split('T')[0],
      assignedTo: '',
      dependencies: []
    });
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (task) => {
    setEditingTaskId(task._id);
    const deadlineFormatted = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '';
    setTaskForm({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      status: task.status,
      deadline: deadlineFormatted,
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      dependencies: task.dependencies?.map(d => d._id || d) || []
    });
    setShowModal(true);
  };

  // Submit Create or Edit
  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTaskId) {
        const res = await tasksApi.updateTask(editingTaskId, taskForm);
        if (res.success) {
          addToast('Task Updated', `Saved changes to "${res.task.title}"`, 'success');
          setShowModal(false);
          loadTasksAndVolunteers();
          refreshEventHealth();
        }
      } else {
        const res = await tasksApi.createTask(currentEvent._id, taskForm);
        if (res.success) {
          addToast('Task Created', `Added "${res.task.title}"`, 'success');
          setShowModal(false);
          loadTasksAndVolunteers();
          refreshEventHealth();
        }
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || err.message, 'error');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId, taskTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${taskTitle}"?`)) return;
    try {
      const res = await tasksApi.deleteTask(taskId);
      if (res.success) {
        addToast('Task Deleted', `Removed "${taskTitle}"`, 'info');
        setTasks(prev => prev.filter(t => t._id !== taskId));
        refreshEventHealth();
      }
    } catch (err) {
      addToast('Delete Failed', err.message, 'error');
    }
  };

  // Move status
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await tasksApi.updateTaskStatus(taskId, newStatus);
      if (res.success) {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        refreshEventHealth();
        addToast('Status Updated', `Task moved to ${newStatus}`, 'info');
      }
    } catch (err) {
      addToast('Status Blocked', err.response?.data?.message || err.message, 'error');
    }
  };

  // Instant Assignee change
  const handleAssignVolunteer = async (taskId, volunteerId) => {
    try {
      const res = await tasksApi.assignTask(taskId, volunteerId);
      if (res.success) {
        setTasks(prev => prev.map(t => t._id === taskId ? res.task : t));
        refreshEventHealth();
        addToast('Assigned', `Task assigned to ${res.volunteer.name}`, 'success');
      }
    } catch (err) {
      addToast('Assignment Failed', err.response?.data?.message || err.message, 'error');
    }
  };

  // AI Auto-Assign Deliverables
  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const res = await tasksApi.autoAssignTasks(currentEvent._id);
      if (res.success) {
        if (res.assignedCount > 0) {
          confetti({ particleCount: 90, spread: 70 });
          addToast('AI Auto-Assignment Complete', res.message, 'success');
        } else {
          addToast('Already Balanced', res.message, 'info');
        }
        await loadTasksAndVolunteers();
        refreshEventHealth();
      }
    } catch (err) {
      addToast('Auto-Assign Failed', err.response?.data?.message || err.message, 'error');
    } finally {
      setAutoAssigning(false);
    }
  };

  // AI Master Plan Generation
  const handleGenerateAiPlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await aiApi.generateEventPlan(currentEvent._id);
      if (res.success) {
        setAiGeneratedTasks(res.tasks);
      }
    } catch (err) {
      addToast('AI Plan Generation Failed', err.message, 'error');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleApplyAiPlan = async () => {
    try {
      const res = await aiApi.applyEventPlan(currentEvent._id, aiGeneratedTasks);
      if (res.success) {
        confetti({ particleCount: 110, spread: 80 });
        addToast('AI Plan Applied', res.message, 'success');
        setShowAiPlanModal(false);
        setAiGeneratedTasks([]);
        loadTasksAndVolunteers();
        refreshEventHealth();
      }
    } catch (err) {
      addToast('Apply Failed', err.message, 'error');
    }
  };

  // Filtered & Searched Tasks computation
  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(t => {
      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchAssignee = t.assignedVolunteerName?.toLowerCase().includes(q);
        const matchCat = t.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAssignee && !matchCat) return false;
      }

      // Quick filter
      if (quickFilter === 'UNASSIGNED') {
        if (t.assignedTo && t.assignedVolunteerName !== 'Unassigned') return false;
      } else if (quickFilter === 'OVERDUE') {
        if (t.status === 'COMPLETED' || new Date(t.deadline) >= now) return false;
      } else if (quickFilter === 'CRITICAL') {
        if (t.priority !== 'CRITICAL') return false;
      }

      // Category filter
      if (filterCategory && t.category !== filterCategory) return false;

      // Priority filter
      if (filterPriority && t.priority !== filterPriority) return false;

      // Assignee filter
      if (filterAssignee) {
        if (filterAssignee === 'UNASSIGNED') {
          if (t.assignedTo && t.assignedVolunteerName !== 'Unassigned') return false;
        } else {
          const assignId = t.assignedTo?._id || t.assignedTo;
          if (assignId !== filterAssignee) return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, quickFilter, filterCategory, filterPriority, filterAssignee]);

  const columns = [
    { id: 'TODO', title: 'To Do', border: 'border-slate-800', dot: 'bg-slate-400' },
    { id: 'IN_PROGRESS', title: 'In Progress', border: 'border-amber-500/30', dot: 'bg-amber-400' },
    { id: 'COMPLETED', title: 'Completed', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
    { id: 'BLOCKED', title: 'Blocked', border: 'border-rose-500/30', dot: 'bg-rose-400' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 font-['Outfit'] flex items-center space-x-2.5">
            <span>Operational Tasks Board</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-brand-300">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Optimally manage deliverables, map dependencies, and use AI to auto-balance volunteer workloads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* AI Auto-Assign Deliverables Button */}
          <button
            onClick={handleAutoAssign}
            disabled={autoAssigning}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-glow-emerald disabled:opacity-50 transition-all"
            title="Automatically assign unassigned tasks to available volunteers based on skills"
          >
            {autoAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
            <span>AI Auto-Assign</span>
          </button>

          {/* AI Plan Generator Button */}
          <button
            onClick={() => {
              setShowAiPlanModal(true);
              if (aiGeneratedTasks.length === 0) handleGenerateAiPlan();
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white text-xs font-semibold shadow-glow transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Master Plan</span>
          </button>

          {/* Create Task Button */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs ${
                viewMode === 'kanban' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Kanban View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs ${
                viewMode === 'table' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Search & Quick Filter Bar */}
      <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, description, category, or assignee..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
          >
            <option value="">All Categories</option>
            <option value="Venue">Venue</option>
            <option value="Registration">Registration</option>
            <option value="Technical">Technical</option>
            <option value="Marketing">Marketing</option>
            <option value="Hospitality">Hospitality</option>
            <option value="Logistics">Logistics</option>
            <option value="Design">Design</option>
            <option value="Sponsorship">Sponsorship</option>
            <option value="Finance">Finance</option>
            <option value="Documentation">Documentation</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Assignee Filter Dropdown */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
          >
            <option value="">All Assignees</option>
            <option value="UNASSIGNED">Unassigned Only</option>
            {volunteers.map(v => (
              <option key={v._id} value={v.userId}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center space-x-2 pt-1 text-xs border-t border-slate-800/80">
          <span className="text-slate-400 font-medium">Quick Views:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'UNASSIGNED', label: 'Unassigned Tasks' },
            { id: 'OVERDUE', label: 'Overdue Deliverables' },
            { id: 'CRITICAL', label: 'Critical Priority' }
          ].map(qf => (
            <button
              key={qf.id}
              onClick={() => setQuickFilter(qf.id)}
              className={`px-3 py-1 rounded-lg border transition-all text-xs font-medium ${
                quickFilter === qf.id
                  ? 'bg-brand-600/30 border-brand-500 text-brand-200 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {qf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className={`rounded-2xl glass-card border ${col.border} p-4 flex flex-col min-h-[550px]`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">{col.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 font-bold px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-12 text-[11px] text-slate-400 border border-dashed border-slate-800 rounded-xl">
                      No tasks in {col.title}
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const isOverdue = task.status !== 'COMPLETED' && new Date(task.deadline) < new Date();
                      const hasIncompleteDeps = task.dependencies && task.dependencies.some(d => d.status !== 'COMPLETED');

                      return (
                        <div
                          key={task._id}
                          className="p-3.5 rounded-xl bg-dark-950/80 hover:bg-dark-900 border border-slate-800 hover:border-brand-500/40 shadow-md space-y-2.5 text-xs transition-all group"
                        >
                          {/* Top Tag Row */}
                          <div className="flex items-start justify-between">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {task.category}
                            </span>
                            <div className="flex items-center space-x-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                task.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                task.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {task.priority}
                              </span>
                              {/* Edit Action Icon */}
                              <button
                                onClick={() => handleOpenEdit(task)}
                                className="p-1 text-slate-400 hover:text-brand-300 transition-colors"
                                title="Edit Task Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {/* Delete Action Icon */}
                              <button
                                onClick={() => handleDeleteTask(task._id, task.title)}
                                className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Task Title */}
                          <div className="font-semibold text-slate-100 leading-snug">
                            {task.title}
                          </div>

                          {task.description && (
                            <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {task.description}
                            </div>
                          )}

                          {/* Dependencies Warning Badge */}
                          {task.dependencies && task.dependencies.length > 0 && (
                            <div className="text-[10px] flex items-center space-x-1 text-slate-400 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                              <LinkIcon className="w-3 h-3 text-brand-400" />
                              <span className="truncate">
                                Prereq: {task.dependencies.map(d => d.title).join(', ')}
                              </span>
                              {hasIncompleteDeps && (
                                <span className="text-rose-400 font-bold ml-1">• Waiting</span>
                              )}
                            </div>
                          )}

                          {/* Assignee & Deadline Select Row */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                            <select
                              value={task.assignedTo?._id || task.assignedTo || ''}
                              onChange={(e) => handleAssignVolunteer(task._id, e.target.value)}
                              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-[10px] flex-1 truncate focus:outline-none focus:border-brand-500"
                            >
                              <option value="">Unassigned</option>
                              {volunteers.map(v => (
                                <option key={v._id} value={v.userId}>
                                  {v.name} ({v.currentWorkload}/{v.maximumWorkload})
                                </option>
                              ))}
                            </select>

                            <span className={`font-mono text-[10px] flex-shrink-0 ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                              {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          {/* Quick Status Forward/Backward Controls */}
                          <div className="flex items-center space-x-1 pt-1 border-t border-slate-800/40">
                            {col.id !== 'TODO' && (
                              <button
                                onClick={() => handleStatusChange(task._id, 'TODO')}
                                className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
                              >
                                ← ToDo
                              </button>
                            )}
                            {col.id !== 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleStatusChange(task._id, 'IN_PROGRESS')}
                                className="text-[10px] text-amber-300 hover:text-amber-200 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
                              >
                                In Progress
                              </button>
                            )}
                            {col.id !== 'COMPLETED' && (
                              <button
                                onClick={() => handleStatusChange(task._id, 'COMPLETED')}
                                className="text-[10px] text-emerald-300 hover:text-emerald-200 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
                              >
                                Complete ✓
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Enhanced Interactive Table View */
        <div className="rounded-2xl glass-card border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Deliverable Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Assigned Volunteer</th>
                  <th className="p-3.5">Deadline</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No deliverables match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(t => {
                    const isOverdue = t.status !== 'COMPLETED' && new Date(t.deadline) < new Date();
                    return (
                      <tr key={t._id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-200">{t.title}</div>
                          {t.description && <div className="text-[11px] text-slate-400 truncate max-w-xs">{t.description}</div>}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {t.category}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            t.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                            t.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t._id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="BLOCKED">Blocked</option>
                          </select>
                        </td>
                        <td className="p-3.5">
                          <select
                            value={t.assignedTo?._id || t.assignedTo || ''}
                            onChange={(e) => handleAssignVolunteer(t._id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none max-w-[140px] truncate"
                          >
                            <option value="">Unassigned</option>
                            {volunteers.map(v => (
                              <option key={v._id} value={v.userId}>
                                {v.name} ({v.currentWorkload}/{v.maximumWorkload})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3.5 font-mono">
                          <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {new Date(t.deadline).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEdit(t)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-slate-800"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t._id, t.title)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl glass-panel bg-dark-900 border border-slate-800 p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-brand-400" />
                <span>{editingTaskId ? 'Edit Deliverable' : 'Create New Operational Task'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5 text-xs flex-1 overflow-y-auto">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Test audio mixing and Hall B livestream connection"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Detailed execution instructions or vendor specifications..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="Venue">Venue</option>
                    <option value="Registration">Registration</option>
                    <option value="Technical">Technical</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Design">Design</option>
                    <option value="Sponsorship">Sponsorship</option>
                    <option value="Finance">Finance</option>
                    <option value="Documentation">Documentation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Deadline Date *</label>
                  <input
                    type="date"
                    required
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Assign Volunteer</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {volunteers.map(v => (
                      <option key={v._id} value={v.userId}>
                        {v.name} ({v.currentWorkload}/{v.maximumWorkload} tasks)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status if editing */}
              {editingTaskId && (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Current Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              )}

              {/* Prerequisite Dependencies Selector */}
              <div>
                <label className="block font-medium text-slate-300 mb-1 flex items-center space-x-1">
                  <LinkIcon className="w-3.5 h-3.5 text-brand-400" />
                  <span>Prerequisite Dependency (Task must finish before this starts)</span>
                </label>
                <select
                  value={taskForm.dependencies[0] || ''}
                  onChange={(e) => setTaskForm({
                    ...taskForm,
                    dependencies: e.target.value ? [e.target.value] : []
                  })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                >
                  <option value="">None (Independent Task)</option>
                  {tasks
                    .filter(t => t._id !== editingTaskId)
                    .map(t => (
                      <option key={t._id} value={t._id}>
                        {t.title} ({t.status})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold shadow-glow transition-all"
                >
                  {editingTaskId ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Event Plan Checklist Modal */}
      {showAiPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl glass-panel bg-dark-900 border border-slate-800 p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-sm text-slate-100">AI Master Event Plan Checklist</h3>
              </div>
              <button onClick={() => setShowAiPlanModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatingPlan ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
                <span className="text-xs text-slate-300 font-medium">Synthesizing 15+ categorized operational tasks...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 text-xs">
                {aiGeneratedTasks.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div className="flex-1 pr-3">
                      <div className="font-semibold text-slate-200">{t.title}</div>
                      <div className="text-[11px] text-slate-400">{t.description}</div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {t.category}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-bold">
                        {t.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {aiGeneratedTasks.length} tasks ready to apply
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAiPlanModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyAiPlan}
                  disabled={aiGeneratedTasks.length === 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow disabled:opacity-50 transition-all"
                >
                  Apply All Tasks to Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
