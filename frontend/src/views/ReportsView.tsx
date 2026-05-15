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
  Layers
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
    
    // Initialize with all members from the original contributions to ensure we show everyone
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
    
    // Calculate for the last 7 weeks
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
    
    const maxVal = Math.max(...velocity, 5); // Scale against at least 5 for visibility
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
    
    // Auto-fit columns logic
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }



  return (
    <>
    {/* Simple Tabular Print View */}
    <div className="hidden print:block p-8 bg-white text-slate-800 min-h-screen font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Cohort Space - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report</h1>
        <p className="text-sm text-slate-500 font-medium">Reporting Duration: {startDate || 'All Time'} to {endDate || 'All Time'}</p>
      </div>

      {activeTab === 'individual' && (
        <table className="w-full text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-indigo-600 text-white">
              <th className="p-3 border border-indigo-700 font-bold whitespace-nowrap">Member Name</th>
              <th className="p-3 border border-indigo-700 font-bold text-center whitespace-nowrap">Completed Tasks</th>
              <th className="p-3 border border-indigo-700 font-bold text-center whitespace-nowrap">Total Assigned</th>
              <th className="p-3 border border-indigo-700 font-bold text-center whitespace-nowrap">Completion Rate</th>
            </tr>
          </thead>
          <tbody>
            {currentContributions
              .filter(c => printTarget === 'all' || c.name === printTarget)
              .map((c, idx) => {
              const percentage = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-3 border border-slate-200 font-medium whitespace-nowrap">{c.name}</td>
                  <td className="p-3 border border-slate-200 text-center">{c.completed}</td>
                  <td className="p-3 border border-slate-200 text-center">{c.total}</td>
                  <td className="p-3 border border-slate-200 text-center font-bold text-indigo-600">{percentage}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {activeTab === 'group' && (
         <table className="w-fit min-w-[400px] text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-primary-600 text-white">
              <th className="p-3 border border-primary-700 font-bold whitespace-nowrap">Metric Name</th>
              <th className="p-3 border border-primary-700 font-bold text-right whitespace-nowrap">Current Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white"><td className="p-3 border border-slate-200 font-medium">Total Project Tasks</td><td className="p-3 border border-slate-200 text-right">{currentStats.totalTasks}</td></tr>
            <tr className="bg-slate-50"><td className="p-3 border border-slate-200 font-medium">Open/Remaining Tasks</td><td className="p-3 border border-slate-200 text-right">{currentStats.openTasks}</td></tr>
            <tr className="bg-white"><td className="p-3 border border-slate-200 font-medium">Overall Completion Rate</td><td className="p-3 border border-slate-200 text-right font-bold text-primary-600">{currentStats.completionRate}%</td></tr>
            <tr className="bg-slate-50"><td className="p-3 border border-slate-200 font-medium">Active Milestones Due</td><td className="p-3 border border-slate-200 text-right">{currentStats.milestonesDue}</td></tr>
            <tr className="bg-white"><td className="p-3 border border-slate-200 font-medium">Active Team Members</td><td className="p-3 border border-slate-200 text-right">{currentStats.activeMembers}</td></tr>
          </tbody>
        </table>
      )}

      {activeTab === 'cohort' && (
         <table className="w-full text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-purple-600 text-white">
              <th className="p-3 border border-purple-700 font-bold whitespace-nowrap">Comparison Benchmark</th>
              <th className="p-3 border border-purple-700 font-bold text-center whitespace-nowrap">Your Group Value</th>
              <th className="p-3 border border-purple-700 font-bold text-center whitespace-nowrap">Cohort Average</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white"><td className="p-3 border border-slate-200 font-medium">Completion Rate</td><td className="p-3 border border-slate-200 text-center font-bold text-purple-600">{currentStats.completionRate}%</td><td className="p-3 border border-slate-200 text-center text-slate-500 font-bold">62%</td></tr>
            <tr className="bg-slate-50"><td className="p-3 border border-slate-200 font-medium">Speed to Complete (days/task)</td><td className="p-3 border border-slate-200 text-center font-bold text-purple-600">2.4</td><td className="p-3 border border-slate-200 text-center text-slate-500 font-bold">2.8</td></tr>
            <tr className="bg-white"><td className="p-3 border border-slate-200 font-medium">Active Participation</td><td className="p-3 border border-slate-200 text-center font-bold text-purple-600">92%</td><td className="p-3 border border-slate-200 text-center text-slate-500 font-bold">80%</td></tr>
            <tr className="bg-slate-50"><td className="p-3 border border-slate-200 font-medium">Milestones Hit</td><td className="p-3 border border-slate-200 text-center font-bold text-purple-600">100%</td><td className="p-3 border border-slate-200 text-center text-slate-500 font-bold">85%</td></tr>
          </tbody>
        </table>
      )}
      
      <div className="mt-12 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        Generated by Cohort Space Intelligence Engine — {new Date().toLocaleString()}
      </div>
    </div>

    {/* Screen View (Hidden on print) */}
    <div className="space-y-8 animate-fade-in pb-12 print:hidden">
      {/* Header and Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-500 font-medium mt-1">Comprehensive insights across individuals and groups.</p>
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
        
        {activeTab !== 'group' && (
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
              <div className="absolute right-0 mt-2 w-72 glass-card rounded-2xl shadow-xl overflow-hidden z-50 border border-slate-100 dark:border-slate-700 max-h-[500px] overflow-y-auto">
                <div className="p-2 space-y-1">
                  
                  <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 mb-1">Global Actions</div>
                  <button onClick={() => exportToPDF('all')} className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <FileText className="w-4 h-4 mr-3" /> Save current view as PDF
                  </button>
                  <button onClick={() => exportToExcel()} className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border-b border-slate-100 dark:border-slate-700 mb-2">
                    <FileSpreadsheet className="w-4 h-4 mr-3" /> Export view to Excel
                  </button>

                  {activeTab === 'individual' && (
                    <>
                      <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 mb-1">Individual Reports</div>
                      {currentContributions.map((c, idx) => (
                        <div key={idx} className="px-1 py-1 group">
                          <div className="px-3 py-1 text-[11px] font-bold text-slate-500 truncate">{c.name}</div>
                          <div className="flex gap-1">
                            <button onClick={() => exportToPDF(c.name)} title="Download PDF" className="flex-1 flex items-center justify-center p-2 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-lg transition-colors">
                              <FileText className="w-3.5 h-3.5 mr-1.5" /> PDF
                            </button>
                            <button onClick={() => exportToExcel(c.name)} title="Download Excel" className="flex-1 flex items-center justify-center p-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded-lg transition-colors">
                              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> Excel
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {activeTab === 'cohort' && (
                    <>
                      <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 mb-1">Targeted Exports</div>
                      
                      <div className="p-2 space-y-2">
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-slate-500 px-1">Just Group Statistics</div>
                          <div className="flex gap-1">
                            <button onClick={() => exportToPDF('group')} className="flex-1 flex items-center justify-center p-2 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-lg transition-colors">
                              <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                            </button>
                            <button onClick={() => exportToExcel('group')} className="flex-1 flex items-center justify-center p-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded-lg transition-colors">
                              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Excel
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-slate-500 px-1">Entire Cohort Averages</div>
                          <div className="flex gap-1">
                            <button onClick={() => exportToPDF('entire')} className="flex-1 flex items-center justify-center p-2 text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 rounded-lg transition-colors">
                              <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                            </button>
                            <button onClick={() => exportToExcel('entire')} className="flex-1 flex items-center justify-center p-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded-lg transition-colors">
                              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Excel
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-3xl w-fit">
        {[
          { id: 'group', label: 'Group Overview', icon: Users },
          { id: 'individual', label: 'Individuals', icon: User },
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
                <div className="flex items-stretch space-x-4 h-64">
                  {velocityData.map((data, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end group">
                      <div className="w-full bg-slate-100/50 dark:bg-slate-800/50 rounded-t-2xl relative overflow-hidden transition-all duration-500 group-hover:bg-slate-200/50 dark:group-hover:bg-slate-700/50" style={{ height: `${data.height}%` }}>
                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-2xl transition-all duration-500 group-hover:brightness-110" style={{ height: `100%` }}></div>
                      </div>
                      <div className="text-center mt-2">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter">Wk {i+1}</span>
                        <span className="block text-[10px] font-bold text-primary-600">{data.count}</span>
                      </div>
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
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{currentStats.completionRate}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Done</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-6">Overall Progress</h3>
                <p className="text-sm text-slate-500 mt-2">{currentStats.openTasks} tasks remaining out of {currentStats.totalTasks}</p>
              </div>
            </div>
          </div>
        )}

        {/* INDIVIDUALS REPORT */}
        {activeTab === 'individual' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {currentContributions.map((c, idx) => {
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
                      <span>{currentStats.completionRate}%</span>
                    </div>
                    <div className="h-4 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${currentStats.completionRate}%` }} />
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
