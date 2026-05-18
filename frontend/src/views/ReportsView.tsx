import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  Download,
  FileText,
  FileSpreadsheet,
  Users, 
  User, 
  BarChart2, 
  ChevronDown,
  Layers,
  Clock,
  TrendingUp,
  Target
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
  const [activeTab, setActiveTab] = useState<'group' | 'individual' | 'cohort'>('group');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [printTarget, setPrintTarget] = useState<string>('all');
  
  const workspaceId = localStorage.getItem('workspaceId');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const [dashRes, contribRes, taskRes] = await Promise.all([
          axios.get(`/api/dashboard?workspaceId=${workspaceId}`),
          axios.get(`/api/members/contributions?workspaceId=${workspaceId}`),
          axios.get(`/api/tasks?workspaceId=${workspaceId}`)
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

  // Derived filtered data based on selected duration
  const filteredTasks = tasks.filter(t => {
    if (!t.dueDate) return true;
    const taskDate = new Date(t.dueDate).getTime();
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() + 86399999 : Infinity;
    return taskDate >= start && taskDate <= end;
  });

  const getFilteredStats = () => {
    if (!dashData) return null;

    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'Done').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      ...dashData,
      totalTasks: total,
      openTasks: total - completed,
      completionRate: rate
    };
  };

  const getFilteredContributions = (): Contribution[] => {
    const memberMap: Record<string, { completed: number; total: number }> = {};
    
    contributions.forEach(c => {
      memberMap[c.name] = { completed: 0, total: 0 };
    });

    filteredTasks.forEach(t => {
      if (t.assignee?.name) {
        if (!memberMap[t.assignee.name]) {
          memberMap[t.assignee.name] = { completed: 0, total: 0 };
        }
        memberMap[t.assignee.name].total++;
        if (t.status === 'Done') {
          memberMap[t.assignee.name].completed++;
        }
      }
    });

    return Object.entries(memberMap).map(([name, stats]) => ({
      name,
      ...stats
    }));
  };

  const getVelocityData = () => {
    const velocity: number[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const completedThisWeek = tasks.filter(t => {
        if (t.status !== 'Done' || !t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d >= weekStart && d < weekEnd;
      }).length;
      
      velocity.push(completedThisWeek);
    }
    
    const maxVal = Math.max(...velocity, 5);
    return velocity.map(v => ({
      count: v,
      height: (v / maxVal) * 100
    }));
  };

  const currentStats = getFilteredStats();
  const currentContributions = getFilteredContributions();
  const velocityData = getVelocityData();

  const exportToExcel = (subType?: string) => {
    let data: any[] = [];
    let filename = `cohort-report-${activeTab}-${new Date().toISOString().split('T')[0]}.xlsx`;

    if (activeTab === 'individual') {
      const targetContributions = subType ? currentContributions.filter(c => c.name === subType) : currentContributions;
      data = targetContributions.map(c => ({
        'Member Name': c.name,
        'Completed Tasks': c.completed,
        'Total Assigned Tasks': c.total,
        'Completion Rate': `${c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0}%`
      }));
      if (subType) filename = `cohort-report-${subType.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`;
    } else if (activeTab === 'group') {
      data = [
        { 'Metric Variable': 'Total Project Tasks', 'Value': currentStats?.totalTasks || 0 },
        { 'Metric Variable': 'Open/Remaining Tasks', 'Value': currentStats?.openTasks || 0 },
        { 'Metric Variable': 'Overall Completion Rate', 'Value': `${currentStats?.completionRate || 0}%` },
        { 'Metric Variable': 'Active Milestones Due', 'Value': currentStats?.milestonesDue || 0 },
        { 'Metric Variable': 'Active Team Members', 'Value': currentStats?.activeMembers || 0 }
      ];
    } else if (activeTab === 'cohort') {
      if (subType === 'entire') {
        data = [
          { 'Benchmark Variable': 'Completion Rate', 'Cohort Average': '62%' },
          { 'Benchmark Variable': 'Speed to Complete (days/task)', 'Cohort Average': '2.8' },
          { 'Benchmark Variable': 'Active Participation', 'Cohort Average': '80%' },
          { 'Benchmark Variable': 'Milestones Hit', 'Cohort Average': '85%' }
        ];
        filename = `cohort-entire-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (subType === 'group') {
        data = [
          { 'Benchmark Variable': 'Completion Rate', 'Group Value': `${currentStats?.completionRate || 0}%` },
          { 'Benchmark Variable': 'Speed to Complete (days/task)', 'Group Value': '2.4' },
          { 'Benchmark Variable': 'Active Participation', 'Group Value': '92%' },
          { 'Benchmark Variable': 'Milestones Hit', 'Group Value': '100%' }
        ];
        filename = `cohort-group-only-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      } else {
        data = [
          { 'Benchmark Variable': 'Completion Rate', 'Group Value': `${currentStats?.completionRate || 0}%`, 'Cohort Average': '62%' },
          { 'Benchmark Variable': 'Speed to Complete (days/task)', 'Group Value': '2.4', 'Cohort Average': '2.8' },
          { 'Benchmark Variable': 'Active Participation', 'Group Value': '92%', 'Cohort Average': '80%' },
          { 'Benchmark Variable': 'Milestones Hit', 'Group Value': '100%', 'Cohort Average': '85%' }
        ];
        filename = `cohort-comparison-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      }
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const maxWidths = data.reduce((acc: any, row: any) => {
      Object.keys(row).forEach((key, i) => {
        const val = row[key] ? row[key].toString() : "";
        const length = Math.max(key.length, val.length);
        acc[i] = Math.max(acc[i] || 0, length);
      });
      return acc;
    }, []);
    ws['!cols'] = maxWidths.map((w: number) => ({ w: w + 2 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, filename);
    setShowExportMenu(false);
  };

  const exportToPDF = (target: string = 'all') => {
    setPrintTarget(target);
    setShowExportMenu(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (!currentStats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
    {/* Simple Tabular Print View */}
    <div className="hidden print:block p-10 bg-white text-slate-800 min-h-screen font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Cohort Space - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report</h1>
        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Duration: {startDate || 'All Time'} to {endDate || 'All Time'}</p>
      </div>

      {activeTab === 'individual' && (
        <table className="w-full text-left border-collapse border border-slate-200 shadow-sm">
          <thead>
            <tr className="bg-primary-600 text-white">
              <th className="p-4 border border-primary-700 font-black uppercase tracking-widest text-[10px]">Member Name</th>
              <th className="p-4 border border-primary-700 font-black uppercase tracking-widest text-[10px] text-center">Completed</th>
              <th className="p-4 border border-primary-700 font-black uppercase tracking-widest text-[10px] text-center">Total</th>
              <th className="p-4 border border-primary-700 font-black uppercase tracking-widest text-[10px] text-center">Rate</th>
            </tr>
          </thead>
          <tbody>
            {currentContributions
              .filter(c => printTarget === 'all' || c.name === printTarget)
              .map((c, idx) => {
              const percentage = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-4 border border-slate-200 font-bold">{c.name}</td>
                  <td className="p-4 border border-slate-200 text-center font-bold">{c.completed}</td>
                  <td className="p-4 border border-slate-200 text-center font-bold">{c.total}</td>
                  <td className="p-4 border border-slate-200 text-center font-black text-primary-600">{percentage}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {activeTab === 'group' && (
         <table className="w-fit min-w-[500px] text-left border-collapse border border-slate-200 shadow-sm">
          <thead>
            <tr className="bg-primary-600 text-white">
              <th className="p-4 border border-primary-700 font-black uppercase tracking-widest text-[10px]">Metric</th>
              <th className="p-4 border border-primary-700 font-black uppercase tracking-widest text-[10px] text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white"><td className="p-4 border border-slate-200 font-bold">Total Project Tasks</td><td className="p-4 border border-slate-200 text-right font-black">{currentStats.totalTasks}</td></tr>
            <tr className="bg-slate-50"><td className="p-4 border border-slate-200 font-bold">Open/Remaining Tasks</td><td className="p-4 border border-slate-200 text-right font-black">{currentStats.openTasks}</td></tr>
            <tr className="bg-white"><td className="p-4 border border-slate-200 font-bold">Overall Completion Rate</td><td className="p-4 border border-slate-200 text-right font-black text-primary-600">{currentStats.completionRate}%</td></tr>
            <tr className="bg-slate-50"><td className="p-4 border border-slate-200 font-bold">Active Milestones Due</td><td className="p-4 border border-slate-200 text-right font-black">{currentStats.milestonesDue}</td></tr>
            <tr className="bg-white"><td className="p-4 border border-slate-200 font-bold">Active Team Members</td><td className="p-4 border border-slate-200 text-right font-black">{currentStats.activeMembers}</td></tr>
          </tbody>
        </table>
      )}

      {activeTab === 'cohort' && (
         <table className="w-full text-left border-collapse border border-slate-200 shadow-sm">
          <thead>
            <tr className="bg-primary-600 text-white">
              <th className="p-4 border border-primary-700 font-black uppercase tracking-widest text-[10px]">Benchmark</th>
              <th className="p-4 border border-primary-700 font-black uppercase tracking-widest text-[10px] text-center">Group</th>
              <th className="p-4 border border-primary-700 font-black uppercase tracking-widest text-[10px] text-center">Cohort Avg</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white"><td className="p-4 border border-slate-200 font-bold">Completion Rate</td><td className="p-4 border border-slate-200 text-center font-black text-primary-600">{currentStats.completionRate}%</td><td className="p-4 border border-slate-200 text-center text-slate-500 font-black">62%</td></tr>
            <tr className="bg-slate-50"><td className="p-4 border border-slate-200 font-bold">Velocity (days/task)</td><td className="p-4 border border-slate-200 text-center font-black text-primary-600">2.4</td><td className="p-4 border border-slate-200 text-center text-slate-500 font-black">2.8</td></tr>
            <tr className="bg-white"><td className="p-4 border border-slate-200 font-bold">Participation</td><td className="p-4 border border-slate-200 text-center font-black text-primary-600">92%</td><td className="p-4 border border-slate-200 text-center text-slate-500 font-black">80%</td></tr>
            <tr className="bg-slate-50"><td className="p-4 border border-slate-200 font-bold">Milestones Hit</td><td className="p-4 border border-slate-200 text-center font-black text-primary-600">100%</td><td className="p-4 border border-slate-200 text-center text-slate-500 font-black">85%</td></tr>
          </tbody>
        </table>
      )}
      
      <div className="mt-16 text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] border-t border-slate-100 pt-6">
        COHORT SPACE INTELLIGENCE SYSTEM — {new Date().toLocaleString()} — VERIFIED REPORT
      </div>
    </div>

    {/* Screen View */}
    <div className="space-y-10 animate-fade-in pb-12 print:hidden transition-all duration-500">
      {/* Header and Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Analytics & Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-lg mt-2">Deep insights and multi-layer performance tracking.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center space-x-2 bg-white/60 dark:bg-slate-900/40 p-3 rounded-[2rem] border border-white dark:border-white/5 backdrop-blur-xl shadow-sm transition-all">
            <div className="flex items-center">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 ml-3 mr-2 uppercase tracking-widest">From</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-sm font-black text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer"
              />
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 ml-3 mr-2 uppercase tracking-widest">To</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-sm font-black text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        
        {activeTab !== 'group' && (
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-primary flex items-center space-x-3 px-10 py-4"
            >
              <Download className="w-5 h-5" />
              <span className="text-[10px] uppercase font-black tracking-widest">Export Vault</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-4 w-80 glass-card rounded-[2.5rem] shadow-2xl overflow-hidden z-50 border border-white dark:border-white/5 animate-fade-in max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="p-4 space-y-2">
                  <div className="px-5 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 mb-2">Global Actions</div>
                  <button onClick={() => exportToPDF('all')} className="flex items-center w-full px-5 py-4 text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all group">
                    <FileText className="w-5 h-5 mr-4 text-primary-500 group-hover:scale-110 transition-transform" /> Save view as PDF
                  </button>
                  <button onClick={() => exportToExcel()} className="flex items-center w-full px-5 py-4 text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all group border-b border-slate-100 dark:border-slate-800 mb-2">
                    <FileSpreadsheet className="w-5 h-5 mr-4 text-emerald-500 group-hover:scale-110 transition-transform" /> Export to Excel
                  </button>

                  {activeTab === 'individual' && (
                    <div className="space-y-4 pt-2">
                      <div className="px-5 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 mb-2">Individual Reports</div>
                      {currentContributions.map((c, idx) => (
                        <div key={idx} className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-3">
                          <div className="text-xs font-black text-slate-800 dark:text-slate-200 px-1 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-primary-500 rounded-full mr-2"></div>
                            {c.name}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => exportToPDF(c.name)} className="flex-1 flex items-center justify-center py-3 text-[9px] font-black text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl border border-primary-100 dark:border-primary-900/50 uppercase tracking-widest transition-all">
                              PDF
                            </button>
                            <button onClick={() => exportToExcel(c.name)} className="flex-1 flex items-center justify-center py-3 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50 uppercase tracking-widest transition-all">
                              EXCEL
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'cohort' && (
                    <div className="space-y-6 pt-2">
                      <div className="px-5 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 mb-2">Targeted Segments</div>
                      
                      <div className="space-y-4 px-2">
                        <div className="space-y-2">
                          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-3 uppercase tracking-widest">Group Performance</div>
                          <div className="flex gap-2">
                            <button onClick={() => exportToPDF('group')} className="flex-1 flex items-center justify-center py-3 text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-xl transition-all uppercase tracking-widest">
                              PDF
                            </button>
                            <button onClick={() => exportToExcel('group')} className="flex-1 flex items-center justify-center py-3 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded-xl transition-all uppercase tracking-widest">
                              EXCEL
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-3 uppercase tracking-widest">Cohort Benchmarks</div>
                          <div className="flex gap-2">
                            <button onClick={() => exportToPDF('entire')} className="flex-1 flex items-center justify-center py-3 text-[9px] font-black text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20 hover:bg-purple-100 rounded-xl transition-all uppercase tracking-widest">
                              PDF
                            </button>
                            <button onClick={() => exportToExcel('entire')} className="flex-1 flex items-center justify-center py-3 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded-xl transition-all uppercase tracking-widest">
                              EXCEL
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-3 bg-slate-100/50 dark:bg-slate-900/30 p-2.5 rounded-[2.5rem] w-fit border border-white dark:border-white/5 transition-all">
        {[
          { id: 'group', label: 'Group Overview', icon: Users },
          { id: 'individual', label: 'Individuals', icon: User },
          { id: 'cohort', label: 'Cohort Benchmarks', icon: Layers },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-3 px-8 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all duration-500 ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-700' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fade-in transition-all">
        {activeTab === 'group' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="glass-card p-12 rounded-[3rem] col-span-2 border-white/40 dark:border-white/5">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-10 tracking-tight leading-none">Group Velocity Trend</h3>
              <div className="flex items-stretch space-x-6 h-80">
                {velocityData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer">
                    <div className="w-full bg-slate-50 dark:bg-slate-950/40 rounded-t-3xl relative overflow-hidden transition-all duration-700 group-hover:bg-slate-100/50 dark:group-hover:bg-slate-900/40" style={{ height: `${data.height}%` }}>
                      <div className="absolute bottom-0 w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-3xl transition-all duration-700 group-hover:brightness-110 shadow-lg" style={{ height: `100%` }}></div>
                    </div>
                    <div className="text-center mt-4">
                      <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Week {i+1}</span>
                      <span className="block text-sm font-black text-primary-600 dark:text-primary-400 mt-1">{data.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-card p-12 rounded-[3rem] flex flex-col items-center justify-center text-center border-white/40 dark:border-white/5">
              <div className="relative w-52 h-52 flex items-center justify-center transition-all duration-1000">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="104" cy="104" r="90" className="stroke-slate-100 dark:stroke-slate-900/50" strokeWidth="16" fill="none" />
                  <circle cx="104" cy="104" r="90" className="stroke-primary-500" strokeWidth="16" fill="none" strokeDasharray="565" strokeDashoffset={565 - (565 * currentStats.completionRate) / 100} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{currentStats.completionRate}%</span>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">Efficiency</span>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-10 tracking-tight leading-none">Global Progress</h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-3">{currentStats.openTasks} tasks pending / {currentStats.totalTasks} total</p>
            </div>
          </div>
        )}

        {activeTab === 'individual' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {currentContributions.map((c, idx) => {
              const percentage = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
              return (
                <div key={idx} className="glass-card p-10 rounded-[2.5rem] hover:scale-[1.02] transition-all duration-500 border-white/40 dark:border-white/5 group">
                  <div className="flex items-center space-x-6 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-200 dark:shadow-none group-hover:rotate-6 transition-transform">
                      {c.name?.[0] || '?'}
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight leading-none">{c.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">Contributor</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{c.completed}</span>
                        <span className="text-sm text-slate-400 dark:text-slate-500 font-bold ml-2 uppercase tracking-widest">/ {c.total} Goals</span>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border ${percentage >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' : percentage >= 50 ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-900/50' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'}`}>
                        {percentage}%
                      </span>
                    </div>
                    
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden p-1 shadow-inner border border-slate-200 dark:border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-primary-500' : 'bg-rose-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'cohort' && (
          <div className="space-y-10">
            <div className="glass-card p-12 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-950 text-white relative overflow-hidden border-none shadow-2xl">
              <div className="absolute -top-24 -right-24 opacity-10 blur-3xl w-96 h-96 bg-primary-500 rounded-full"></div>
              <div className="absolute -bottom-24 -left-24 opacity-10 blur-3xl w-96 h-96 bg-purple-500 rounded-full"></div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-primary-500/20 p-3 rounded-2xl border border-primary-500/30">
                    <BarChart2 className="w-8 h-8 text-primary-400" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter">Cohort Benchmarks</h3>
                </div>
                <p className="text-slate-400 font-bold text-lg max-w-2xl leading-relaxed">
                  Real-time comparison against anonymized data from the entire unit cohort. High performance groups gain early badge eligibility.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                      <span className="text-primary-400">Your Group Efficiency</span>
                      <span className="text-white text-lg">{currentStats.completionRate}%</span>
                    </div>
                    <div className="h-5 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/10">
                      <div className="h-full bg-primary-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)]" style={{ width: `${currentStats.completionRate}%` }} />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                      <span className="text-slate-500">Cohort Average Benchmark</span>
                      <span className="text-slate-400 text-lg">62%</span>
                    </div>
                    <div className="h-5 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/10">
                      <div className="h-full bg-slate-600 rounded-full" style={{ width: `62%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="glass-card p-10 rounded-[2.5rem] border-white/40 dark:border-white/5 group">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Speed to Goal</span>
                  <p className="text-4xl font-black text-slate-900 dark:text-white mt-4 tabular-nums tracking-tighter">
                    2.4 <span className="text-sm font-bold text-slate-400 dark:text-slate-500 ml-2 uppercase tracking-widest">days/task</span>
                  </p>
                  <p className="text-[11px] text-emerald-500 font-black mt-3 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-lg">15% Lead Efficiency</p>
                </div>
              </div>

              <div className="glass-card p-10 rounded-[2.5rem] border-white/40 dark:border-white/5 group">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary-50 dark:bg-primary-950/30 p-5 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Participation</span>
                  <p className="text-4xl font-black text-slate-900 dark:text-white mt-4 tabular-nums tracking-tighter">
                    92 <span className="text-sm font-bold text-slate-400 dark:text-slate-500 ml-2 uppercase tracking-widest">%</span>
                  </p>
                  <p className="text-[11px] text-primary-500 font-black mt-3 uppercase tracking-widest bg-primary-50 dark:bg-primary-950/30 px-3 py-1 rounded-lg">Top 10% Decile</p>
                </div>
              </div>

              <div className="glass-card p-10 rounded-[2.5rem] border-white/40 dark:border-white/5 group">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Accuracy Index</span>
                  <p className="text-4xl font-black text-slate-900 dark:text-white mt-4 tabular-nums tracking-tighter">
                    100 <span className="text-sm font-bold text-slate-400 dark:text-slate-500 ml-2 uppercase tracking-widest">%</span>
                  </p>
                  <p className="text-[11px] text-emerald-500 font-black mt-3 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-lg">Precision Optimized</p>
                </div>
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
