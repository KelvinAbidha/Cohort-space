import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Printer, 
  Users, 
  User, 
  BarChart2, 
  Calendar,
  ChevronDown,
  Activity,
  Layers,
  Clock
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  assignee?: { name: string };
}

interface Contribution {
  name: string;
  completed: number;
  total: number;
}

interface DashboardData {
  openTasks: number;
  totalTasks: number;
  milestonesDue: number;
  completionRate: number;
  activeMembers: number;
}

const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'group' | 'individual' | 'timeline' | 'cohort'>('group');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const workspaceId = localStorage.getItem('workspaceId');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const [dashRes, contribRes, taskRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/dashboard?workspaceId=${workspaceId}`),
          axios.get(`http://localhost:5000/api/members/contributions?workspaceId=${workspaceId}`),
          axios.get(`http://localhost:5000/api/tasks?workspaceId=${workspaceId}`)
        ]);
        setDashData(dashRes.data);
        setContributions(contribRes.data);
        setTasks(taskRes.data);
      } catch (err) {
        console.error('Error fetching report data', err);
      }
    };
    fetchReportData();
  }, [workspaceId]);

  const filteredTasks = tasks.filter(t => {
    if (!t.dueDate) return true;
    const taskDate = new Date(t.dueDate).getTime();
    // To properly include the whole end date, we add 24 hours minus 1 ms
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() + 86399999 : Infinity;
    return taskDate >= start && taskDate <= end;
  });

  const exportToCSV = () => {
    // Generate CSV from tasks data
    const headers = ['Task Title', 'Status', 'Priority', 'Assignee', 'Due Date'];
    const rows = filteredTasks.map(t => [
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.assignee?.name || 'Unassigned',
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cohort-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    // Triggers native print dialog which natively supports "Save as PDF"
    window.print();
    setShowExportMenu(false);
  };

  if (!dashData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Helper for timeline
  const sortedTasks = [...filteredTasks]
    .filter(t => t.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <>
    {/* Tabular Print View (Hidden on screen) */}
    <div className="hidden print:block p-8 bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold mb-2">Cohort Space - Timeline Report</h1>
      <p className="mb-6 text-sm text-gray-500 font-medium">Timeline Filter: {startDate || 'All Time'} to {endDate || 'All Time'}</p>
      <table className="w-full text-left border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-3 font-bold">Task Title</th>
            <th className="border border-gray-300 p-3 font-bold">Status</th>
            <th className="border border-gray-300 p-3 font-bold">Priority</th>
            <th className="border border-gray-300 p-3 font-bold">Assignee</th>
            <th className="border border-gray-300 p-3 font-bold">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.length > 0 ? filteredTasks.map(t => (
            <tr key={t.id}>
              <td className="border border-gray-300 p-3 font-medium">{t.title}</td>
              <td className="border border-gray-300 p-3">{t.status}</td>
              <td className="border border-gray-300 p-3">{t.priority}</td>
              <td className="border border-gray-300 p-3">{t.assignee?.name || 'Unassigned'}</td>
              <td className="border border-gray-300 p-3">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'}</td>
            </tr>
          )) : (
             <tr>
               <td colSpan={5} className="border border-gray-300 p-3 text-center text-gray-500">No tasks found for this timeline.</td>
             </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Screen View (Hidden on print) */}
    <div className="space-y-8 animate-fade-in pb-12 print:hidden">
      {/* Header and Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-500 font-medium mt-1">Comprehensive insights across individuals, groups, and timeline.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Date Filter */}
          <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center">
              <span className="text-[10px] font-black text-slate-400 ml-2 mr-1 uppercase tracking-widest">From</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer"
              />
            </div>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
            <div className="flex items-center">
              <span className="text-[10px] font-black text-slate-400 ml-2 mr-1 uppercase tracking-widest">To</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary-200 dark:shadow-none"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl shadow-xl overflow-hidden z-50 border border-slate-100 dark:border-slate-700">
              <div className="p-2 space-y-1">
                <button onClick={exportToPDF} className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 rounded-xl transition-colors">
                  <FileText className="w-4 h-4 mr-3" /> Save as PDF
                </button>
                <button onClick={exportToCSV} className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 rounded-xl transition-colors">
                  <FileSpreadsheet className="w-4 h-4 mr-3" /> Export CSV Data
                </button>
                <button onClick={exportToPDF} className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <Printer className="w-4 h-4 mr-3" /> Print Report
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-3xl w-fit">
        {[
          { id: 'group', label: 'Group Overview', icon: Users },
          { id: 'individual', label: 'Individuals', icon: User },
          { id: 'timeline', label: 'Timeline', icon: Calendar },
          { id: 'cohort', label: 'Cohort Benchmarks', icon: Layers },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-md shadow-slate-200/50 dark:shadow-none' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8 animate-fade-in">
        
        {/* GROUP REPORT */}
        {activeTab === 'group' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card p-8 rounded-3xl col-span-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Group Velocity</h3>
                <div className="flex items-end space-x-4 h-64">
                  {/* Mocking a bar chart using tailwind */}
                  {[40, 60, 30, 80, 50, 90, 70].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end group">
                      <div className="w-full bg-primary-100 dark:bg-primary-900/30 rounded-t-xl relative overflow-hidden transition-all duration-500 group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50" style={{ height: `${height}%` }}>
                        <div className="absolute bottom-0 w-full bg-primary-500 dark:bg-primary-500 transition-all duration-500 group-hover:bg-primary-400" style={{ height: `${height * 0.8}%` }}></div>
                      </div>
                      <span className="text-center text-xs font-bold text-slate-400 mt-2">Week {i+1}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="12" fill="none" />
                    <circle cx="80" cy="80" r="70" className="stroke-primary-500" strokeWidth="12" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * dashData.completionRate) / 100} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{dashData.completionRate}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Done</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-6">Overall Progress</h3>
                <p className="text-sm text-slate-500 mt-2">{dashData.openTasks} tasks remaining out of {dashData.totalTasks}</p>
              </div>
            </div>
          </div>
        )}

        {/* INDIVIDUALS REPORT */}
        {activeTab === 'individual' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {contributions.map((c, idx) => {
              const percentage = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
              return (
                <div key={idx} className="glass-card p-8 rounded-3xl hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200 dark:shadow-none">
                      {c.name?.[0] || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">{c.name}</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Team Member</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{c.completed}</span>
                        <span className="text-sm text-slate-500 font-medium ml-1">/ {c.total} tasks</span>
                      </div>
                      <span className={`text-xs font-black px-2 py-1 rounded-lg uppercase ${percentage >= 80 ? 'bg-emerald-50 text-emerald-600' : percentage >= 50 ? 'bg-primary-50 text-primary-600' : 'bg-rose-50 text-rose-600'}`}>
                        {percentage}% Rate
                      </span>
                    </div>
                    
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-primary-500' : 'bg-rose-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TIMELINE REPORT */}
        {activeTab === 'timeline' && (
          <div className="glass-card p-10 rounded-[2.5rem]">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-10 flex items-center">
              <Activity className="w-5 h-5 mr-3 text-primary-600" />
              Chronological Task Flow
            </h3>
            
            <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-12">
              {sortedTasks.length > 0 ? sortedTasks.map((task, idx) => {
                const dateObj = new Date(task.dueDate);
                const isOverdue = dateObj < new Date() && task.status !== 'Done';
                
                return (
                  <div key={idx} className="relative pl-8 group">
                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center ${task.status === 'Done' ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-primary-500'}`}>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className={`text-lg font-bold ${task.status === 'Done' ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{task.title}</h4>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                            task.priority === 'High' ? 'bg-rose-50 text-rose-600' : 
                            task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 flex items-center">
                          <Clock className="w-4 h-4 mr-2 opacity-50" />
                          Due: {dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      
                      {task.assignee && (
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                           <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-bold text-primary-600">
                             {task.assignee.name[0]}
                           </div>
                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{task.assignee.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="py-12 text-center text-slate-500">No scheduled tasks found to generate timeline.</div>
              )}
            </div>
          </div>
        )}

        {/* COHORT REPORT */}
        {activeTab === 'cohort' && (
          <div className="space-y-8">
            <div className="glass-card p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <BarChart2 className="w-64 h-64" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-2">Cohort vs. Group Analysis</h3>
                <p className="text-slate-400 font-medium max-w-xl">
                  Compare your group's performance against the anonymized average of other groups within the same unit cohort.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-3">
                      <span className="text-primary-300">Your Group Completion</span>
                      <span>{dashData.completionRate}%</span>
                    </div>
                    <div className="h-4 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${dashData.completionRate}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-3">
                      <span className="text-slate-400">Cohort Average (Est.)</span>
                      <span>62%</span>
                    </div>
                    <div className="h-4 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: `62%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card p-8 rounded-3xl text-center">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Speed to Complete</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-4 flex items-center justify-center">
                  2.4 <span className="text-sm font-medium text-slate-500 ml-2">days/task</span>
                </p>
                <p className="text-xs text-emerald-500 font-bold mt-2">15% faster than cohort</p>
              </div>
              <div className="glass-card p-8 rounded-3xl text-center">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Participation</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-4 flex items-center justify-center">
                  92 <span className="text-sm font-medium text-slate-500 ml-2">%</span>
                </p>
                <p className="text-xs text-primary-500 font-bold mt-2">Top 10% in unit</p>
              </div>
              <div className="glass-card p-8 rounded-3xl text-center">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Milestones Hit</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-4 flex items-center justify-center">
                  100 <span className="text-sm font-medium text-slate-500 ml-2">%</span>
                </p>
                <p className="text-xs text-emerald-500 font-bold mt-2">Perfect streak</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
    </>
  );
};

export default ReportsView;
