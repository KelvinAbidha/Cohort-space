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

  if (!data) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  const stats = [
    { label: 'Upcoming Deadlines', value: data.milestonesDue, icon: Target, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Open Tasks', value: data.openTasks, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completion Rate', value: `${data.completionRate}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Members', value: data.activeMembers, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
  ];

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Project Overview</h1>
        <p className="text-slate-500 font-medium">Welcome back! Here's the current pulse of your workspace.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card p-8 rounded-3xl group hover:scale-[1.02] transition-all duration-300">
              <div className="flex flex-col space-y-4">
                <div className={`${stat.bg} w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm`}>
                  <Icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Accountability Chart - Takes 2 columns */}
        <div className="lg:col-span-2 glass-card p-10 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Team Accountability</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Real-time task completion by member</p>
            </div>
            <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full uppercase tracking-[0.2em]">Monitoring Active</span>
          </div>
          
          <div className="space-y-8">
            {contributions.map((c, idx) => {
              const percentage = c.total > 0 ? (c.completed / c.total) * 100 : 0;
              return (
                <div key={idx} className="group flex items-center space-x-6">
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                    {c.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 tracking-tight">{c.name}</span>
                      <span className="text-xs font-bold text-slate-500">{c.completed} / {c.total} TASKS DONE</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100/50 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                          percentage > 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 
                          percentage > 40 ? 'bg-gradient-to-r from-primary-400 to-primary-500' : 
                          'bg-gradient-to-r from-amber-400 to-amber-500'
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
        <div className="glass-card p-10 rounded-[2.5rem] flex flex-col">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-primary-600" />
              Timeline
            </h2>
          </div>
          
          <div className="space-y-6 flex-1">
            {data.upcomingDeadlines.length > 0 ? (
              data.upcomingDeadlines.map((m, idx) => (
                <div key={idx} className="group relative pl-8 pb-8 last:pb-0">
                   {/* Vertical line connector */}
                  {idx < data.upcomingDeadlines.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-100"></div>
                  )}
                  {/* Dot */}
                  <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 z-10 flex items-center justify-center ${
                    m.type === 'milestone' ? 'border-primary-500' : 'border-amber-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${m.type === 'milestone' ? 'bg-primary-500' : 'bg-amber-400'}`}></div>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                       <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-primary-600 transition-colors tracking-tight">{m.title}</p>
                       <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                         m.type === 'milestone' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'
                       }`}>
                         {m.type}
                       </span>
                    </div>
                    <div className="flex items-center text-xs font-bold text-slate-400">
                      <Clock className="w-3 h-3 mr-1.5" />
                      {new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                 <Clock className="w-10 h-10 text-slate-300 mb-3" />
                 <p className="text-sm text-slate-400 text-center font-medium italic">No upcoming deadlines</p>
                 <p className="text-[10px] text-slate-400 text-center mt-1 uppercase tracking-widest">Add tasks with due dates in the board</p>
              </div>
            )}
          </div>

          <button className="w-full mt-10 py-4 text-xs font-black text-primary-600 bg-primary-50/50 rounded-2xl hover:bg-primary-50 transition-all duration-300 uppercase tracking-[0.2em] flex items-center justify-center">
            Full Schedule
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
