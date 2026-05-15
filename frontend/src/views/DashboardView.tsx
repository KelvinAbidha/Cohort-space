import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Clock, 
  Users, 
  Target, 
  ChevronRight,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface DashboardData {
  openTasks: number;
  totalTasks: number;
  milestonesDue: number;
  completionRate: number;
  activeMembers: number;
  upcomingDeadlines: any[];
}

interface Contribution {
  name: string;
  completed: number;
  total: number;
}

const DashboardView: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);
  const workspaceId = localStorage.getItem('workspaceId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, contribRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/dashboard?workspaceId=${workspaceId}`),
          axios.get(`http://localhost:5000/api/members/contributions?workspaceId=${workspaceId}`)
        ]);
        setData(dashRes.data);
        setContributions(contribRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      }
    };
    fetchData();
  }, [workspaceId]);

  if (!data) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  );

  const stats = [
    { label: 'Upcoming Deadlines', value: data.milestonesDue, icon: Target, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { label: 'Open Tasks', value: data.openTasks, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Completion Rate', value: `${data.completionRate}%`, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Active Members', value: data.activeMembers, icon: Users, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  ];

  const displayedDeadlines = showAllDeadlines 
    ? data.upcomingDeadlines 
    : data.upcomingDeadlines.slice(0, 5);

  return (
    <div className="space-y-12 animate-fade-in transition-all duration-500">
      {/* Header section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Project Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">Welcome back! Here's the current pulse of your workspace.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card p-10 rounded-[2.5rem] group hover:scale-[1.02] transition-all duration-500 border-white/40 dark:border-white/5">
              <div className="flex flex-col space-y-6">
                <div className={`${stat.bg} w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition-colors`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white mt-1.5 tabular-nums tracking-tighter">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Accountability Chart - Takes 2 columns */}
        <div className="lg:col-span-2 glass-card p-12 rounded-[3rem] border-white/40 dark:border-white/5">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Team Accountability</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Real-time task completion by member</p>
            </div>
            <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-primary-100 dark:border-primary-900/50">Monitoring Active</span>
          </div>
          
          <div className="space-y-10">
            {contributions.map((c, idx) => {
              const percentage = c.total > 0 ? (c.completed / c.total) * 100 : 0;
              return (
                <div key={idx} className="group flex items-center space-x-8">
                   <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center font-black text-slate-600 dark:text-slate-300 text-lg shadow-inner transition-colors">
                    {c.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-800 dark:text-white tracking-tight text-lg">{c.name}</span>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{c.completed} / {c.total} TASKS DONE</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${
                          percentage > 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-emerald-200 dark:shadow-none' : 
                          percentage > 40 ? 'bg-gradient-to-r from-primary-400 to-primary-500 shadow-primary-200 dark:shadow-none' : 
                          'bg-gradient-to-r from-amber-400 to-amber-500 shadow-amber-200 dark:shadow-none'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="glass-card p-12 rounded-[3rem] flex flex-col border-white/40 dark:border-white/5">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center leading-none">
              <Calendar className="w-8 h-8 mr-4 text-primary-600 dark:text-primary-400" />
              Timeline
            </h2>
          </div>
          
          <div className="space-y-8 flex-1">
            {displayedDeadlines.length > 0 ? (
              displayedDeadlines.map((m, idx) => (
                <div key={idx} className="group relative pl-10 pb-10 last:pb-0">
                   {/* Vertical line connector */}
                  {idx < displayedDeadlines.length - 1 && (
                    <div className="absolute left-[13px] top-8 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800"></div>
                  )}
                  {/* Dot */}
                  <div className={`absolute left-0 top-1.5 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 z-10 flex items-center justify-center transition-colors ${
                    m.type === 'milestone' ? 'border-primary-500 dark:border-primary-400' : 'border-amber-400 dark:border-amber-400'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${m.type === 'milestone' ? 'bg-primary-500' : 'bg-amber-400'}`}></div>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center space-x-3">
                       <p className="text-base font-black text-slate-800 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tracking-tight leading-tight">{m.title}</p>
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest whitespace-nowrap ${
                         m.type === 'milestone' ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50' : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50'
                       }`}>
                         {m.type}
                       </span>
                    </div>
                    <div className="flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                      <Clock className="w-3.5 h-3.5 mr-2" />
                      {new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 opacity-50 dark:opacity-40">
                 <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] mb-6">
                    <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                 </div>
                 <p className="text-base text-slate-400 dark:text-slate-500 text-center font-black tracking-tight">No upcoming deadlines</p>
                 <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2 uppercase tracking-[0.2em] font-bold">Add tasks with due dates in the board</p>
              </div>
            )}
          </div>

          {data.upcomingDeadlines.length > 5 && (
            <button 
              onClick={() => setShowAllDeadlines(!showAllDeadlines)}
              className="w-full mt-12 py-5 text-[10px] font-black text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/20 rounded-[2rem] hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all duration-300 uppercase tracking-[0.3em] flex items-center justify-center border border-primary-100 dark:border-primary-900/50"
            >
              {showAllDeadlines ? 'Show Less' : 'Full Schedule'}
              <ChevronRight className={`w-4 h-4 ml-3 transition-transform duration-500 ${showAllDeadlines ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
