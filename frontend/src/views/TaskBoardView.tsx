import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Calendar, 
  MoreVertical, 
  ArrowRight,
  X,
  Clock,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string | null;
  dueDate: string | null;
  assignee: { name: string } | null;
  milestone: { title: string } | null;
}

const TaskBoardView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [newTask, setNewTask] = useState({
    title: '',
    assigneeId: '',
    milestoneId: '',
    dueDate: '',
    priority: 'Medium'
  });
  
  const workspaceId = localStorage.getItem('workspaceId');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tasks?workspaceId=${workspaceId}`);
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks', err);
    }
  }, [workspaceId]);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/meta?workspaceId=${workspaceId}`);
      setMembers(res.data.members);
      setMilestones(res.data.milestones);
    } catch (err) {
      console.error('Error fetching meta', err);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchTasks();
    fetchMeta();
  }, [fetchTasks, fetchMeta]);

  // Handle Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    if (showModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await axios.put(`http://localhost:5000/api/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Error updating task', err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/tasks', {
        ...newTask,
        workspaceId
      });
      setShowModal(false);
      setNewTask({ title: '', assigneeId: '', milestoneId: '', dueDate: '', priority: 'Medium' });
      fetchTasks();
    } catch (err) {
      console.error('Error creating task', err);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const columns = ['To Do', 'In Progress', 'Done'];

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 p-4 rounded-3xl border border-white/60 backdrop-blur-sm shadow-sm">
        <div className="flex-1 flex items-center space-x-4 max-w-2xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search tasks..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all font-medium text-sm shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
            <select 
              className="pl-11 pr-10 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none transition-all font-bold text-xs uppercase tracking-widest text-slate-700 appearance-none shadow-inner"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priority</option>
              <option value="High">🔴 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center space-x-2 px-8 py-3.5 rounded-2xl shadow-xl shadow-primary-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">New Task</span>
        </button>
      </div>

      {/* Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-280px)] overflow-hidden">
        {columns.map(col => (
          <div key={col} className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-3 mb-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  col === 'To Do' ? 'bg-slate-400' : col === 'In Progress' ? 'bg-primary-500' : 'bg-emerald-500'
                }`}></div>
                <h2 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">{col}</h2>
                <span className="bg-white/80 border border-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full text-[9px] font-black shadow-sm">
                  {filteredTasks.filter(t => t.status === col).length}
                </span>
              </div>
            </div>
            
            <div className="kanban-column overflow-y-auto flex-1 custom-scrollbar shadow-inner bg-slate-100/40 p-4 space-y-4">
              {filteredTasks.filter(t => t.status === col).map(task => (
                <div key={task.id} className="task-card group/card bg-white hover:border-primary-200 !mb-0">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-wrap gap-2">
                       <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                         {task.priority || 'Medium'}
                       </span>
                       {task.milestone && (
                         <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider">
                           {task.milestone.title}
                         </span>
                       )}
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover/card:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-sm text-slate-800 mb-4 leading-relaxed group-hover/card:text-primary-700 transition-colors">
                    {task.title}
                  </h3>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-primary-50 flex items-center justify-center text-[9px] font-black text-primary-600 border border-primary-100">
                        {(task.assignee?.name?.[0] || 'U').toUpperCase()}
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">{task.assignee?.name || 'Unassigned'}</span>
                    </div>
                    {task.dueDate && (
                       <div className="flex items-center text-[9px] font-bold text-slate-400">
                         <Calendar className="w-3 h-3 mr-1" />
                         {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                       </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    {col !== 'To Do' && (
                      <button 
                        onClick={() => handleStatusChange(task.id, columns[columns.indexOf(col)-1])}
                        className="flex-1 text-[8px] font-black bg-slate-50 text-slate-400 py-2 rounded-lg hover:bg-slate-100 uppercase tracking-widest transition-colors"
                      >
                        Back
                      </button>
                    )}
                    {col !== 'Done' && (
                      <button 
                        onClick={() => handleStatusChange(task.id, columns[columns.indexOf(col)+1])}
                        className="flex-[2] text-[8px] font-black bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 uppercase tracking-widest flex items-center justify-center transition-all shadow-md shadow-primary-100"
                      >
                        Push <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                    )}
                    {col === 'Done' && (
                       <div className="flex-1 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 className="w-4 h-4" />
                       </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredTasks.filter(t => t.status === col).length === 0 && (
                 <div className="border-2 border-dashed border-slate-200/50 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-300 bg-white/20">
                    <Clock className="w-6 h-6 mb-2 opacity-20" />
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-center">Empty Stage</span>
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Compact & Portable */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 animate-modal-in border border-white relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Top decorative bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary-600"></div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Deploy New Task</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Task Assignment</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Design Research"
                  className="w-full px-5 py-3.5 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none font-bold text-slate-800 text-sm transition-all shadow-inner bg-slate-50/50"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignee</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 shadow-inner"
                    value={newTask.assigneeId}
                    onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}
                    required
                  >
                    <option value="">Select...</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                   <select 
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 shadow-inner"
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 shadow-inner"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Milestone</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 shadow-inner"
                    value={newTask.milestoneId}
                    onChange={e => setNewTask({...newTask, milestoneId: e.target.value})}
                  >
                    <option value="">None</option>
                    {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-4 rounded-xl mt-2 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-200">
                Confirm & Create
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoardView;
