import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Calendar, 
  ArrowRight,
  X,
  Clock,
  Search,
  Filter,
  Trash2,
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
      const res = await axios.get(`/api/tasks?workspaceId=${workspaceId}`);
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks', err);
    }
  }, [workspaceId]);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await axios.get(`/api/meta?workspaceId=${workspaceId}`);
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
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Error updating task', err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/tasks', {
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
      case 'High': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50';
      case 'Medium': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50';
      case 'Low': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50';
      default: return 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative z-10 transition-all duration-500">
      {/* Search and Filters Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/60 dark:border-white/5 backdrop-blur-xl shadow-sm transition-all">
        <div className="flex-1 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-3xl w-full">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search tasks..."
              className="w-full pl-11 pr-4 py-4 bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:border-primary-400 outline-none transition-all font-bold text-sm shadow-inner dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
            <select 
              className="w-full sm:w-auto pl-11 pr-10 py-4 bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-700 dark:text-slate-300 appearance-none shadow-inner"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All" className="dark:bg-slate-900">All Priority</option>
              <option value="High" className="dark:bg-slate-900">🔴 High</option>
              <option value="Medium" className="dark:bg-slate-900">🟡 Medium</option>
              <option value="Low" className="dark:bg-slate-900">🟢 Low</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center space-x-3 px-10 py-4 rounded-2xl shadow-2xl shadow-primary-200 dark:shadow-none hover:scale-[1.02] active:scale-95 whitespace-nowrap w-full lg:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">New Task</span>
        </button>
      </div>

      {/* Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[calc(100vh-260px)] min-h-[600px] overflow-hidden transition-all">
        {columns.map(col => (
          <div key={col} className="flex flex-col h-full overflow-hidden group/stage">
            <div className="flex items-center justify-between px-4 mb-5 flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  col === 'To Do' ? 'bg-slate-400 dark:bg-slate-600' : col === 'In Progress' ? 'bg-primary-500' : 'bg-emerald-500'
                }`}></div>
                <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] text-[11px]">{col}</h2>
                <span className="bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-[10px] font-black shadow-sm">
                  {filteredTasks.filter(t => t.status === col).length}
                </span>
              </div>
            </div>
            
            <div className="kanban-column overflow-y-auto flex-1 custom-scrollbar shadow-inner bg-slate-100/30 dark:bg-slate-950/30 p-5 space-y-5 transition-all">
              {filteredTasks.filter(t => t.status === col).map(task => (
                <div key={task.id} className="task-card group/card bg-white dark:bg-slate-800/60 hover:border-primary-200 dark:hover:border-primary-500/50 !mb-0 p-6 rounded-3xl border border-white dark:border-slate-700/50 shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap gap-2">
                       <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border ${getPriorityColor(task.priority)} transition-colors`}>
                         {task.priority || 'Medium'}
                       </span>
                       {task.milestone && (
                         <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-slate-100 dark:border-slate-700 transition-colors">
                           {task.milestone.title}
                         </span>
                       )}
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover/card:opacity-100 p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="font-black text-[15px] text-slate-900 dark:text-white mb-6 leading-relaxed group-hover/card:text-primary-700 dark:group-hover/card:text-primary-400 transition-colors tracking-tight">
                    {task.title}
                  </h3>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-black text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 transition-colors">
                        {(task.assignee?.name?.[0] || 'U').toUpperCase()}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-tight">{task.assignee?.name || 'Unassigned'}</span>
                    </div>
                    {task.dueDate && (
                       <div className="flex items-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                         <Calendar className="w-3.5 h-3.5 mr-1.5" />
                         {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                       </div>
                    )}
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                    {col !== 'To Do' && (
                      <button 
                        onClick={() => handleStatusChange(task.id, columns[columns.indexOf(col)-1])}
                        className="flex-1 text-[9px] font-black bg-slate-50 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 uppercase tracking-widest transition-all border border-slate-100 dark:border-slate-700"
                      >
                        Back
                      </button>
                    )}
                    {col !== 'Done' && (
                      <button 
                        onClick={() => handleStatusChange(task.id, columns[columns.indexOf(col)+1])}
                        className="flex-[2] text-[9px] font-black bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 uppercase tracking-widest flex items-center justify-center transition-all shadow-xl shadow-primary-200 dark:shadow-none"
                      >
                        Push <ArrowRight className="w-3.5 h-3.5 ml-2" />
                      </button>
                    )}
                    {col === 'Done' && (
                       <div className="flex-1 flex items-center justify-center text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                          <CheckCircle2 className="w-5 h-5" />
                       </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredTasks.filter(t => t.status === col).length === 0 && (
                 <div className="border-2 border-dashed border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-white/20 dark:bg-slate-900/10">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl mb-4 shadow-sm border border-slate-50 dark:border-slate-700">
                      <Clock className="w-8 h-8 opacity-20 dark:opacity-40" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-center">Empty Stage</span>
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl max-w-lg w-full p-10 animate-modal-in border border-white dark:border-slate-800 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Top decorative bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary-600"></div>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Deploy Task</h2>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Resource Assignment</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Technical Documentation"
                  className="w-full px-6 py-4.5 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:border-primary-500 outline-none font-black text-slate-800 dark:text-white text-sm transition-all shadow-inner bg-slate-50/50 dark:bg-slate-950/50"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Assignee</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 shadow-inner"
                    value={newTask.assigneeId}
                    onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}
                    required
                  >
                    <option value="" className="dark:bg-slate-900">Select...</option>
                    {members.map(m => <option key={m.id} value={m.id} className="dark:bg-slate-900">{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Priority</label>
                   <select 
                    className="w-full px-5 py-4 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 shadow-inner"
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="High" className="dark:bg-slate-900">🔴 High</option>
                    <option value="Medium" className="dark:bg-slate-900">🟡 Medium</option>
                    <option value="Low" className="dark:bg-slate-900">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-5 py-4 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 shadow-inner"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Milestone</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 shadow-inner"
                    value={newTask.milestoneId}
                    onChange={e => setNewTask({...newTask, milestoneId: e.target.value})}
                  >
                    <option value="" className="dark:bg-slate-900">None</option>
                    {milestones.map(m => <option key={m.id} value={m.id} className="dark:bg-slate-900">{m.title}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-5 rounded-2xl mt-4 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary-200 dark:shadow-none">
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
