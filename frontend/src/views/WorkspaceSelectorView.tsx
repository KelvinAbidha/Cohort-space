import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Library, 
  ArrowRight,
  Monitor,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Plus,
  X,
  Hash,
  AlertCircle,
  LayoutGrid,
  ShieldCheck,
  Zap
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle.tsx';

interface GroupedWorkspaces {
    [unitName: string]: {
        workspaceId: number;
        workspaceName: string;
        code: string;
        unitName: string;
        memberId: number;
    }[];
}

interface Unit {
  id: number;
  name: string;
}

const WorkspaceSelectorView: React.FC = () => {
  const [groups, setGroups] = useState<GroupedWorkspaces | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const [createData, setCreateData] = useState({ unitId: '', groupNumber: '' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const navigate = useNavigate();

  const fetchGroups = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${userId}/workspaces`);
      setGroups(res.data);
    } catch (err) {
      console.error('Error fetching workspaces', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchUnits = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/units');
      setUnits(res.data);
    } catch (err) {
      console.error('Error fetching units', err);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchGroups();
      fetchUnits();
    }
  }, [userId, fetchGroups, fetchUnits]);

  const enterWorkspace = (ws: any) => {
    localStorage.setItem('workspaceId', ws.workspaceId.toString());
    localStorage.setItem('workspaceName', ws.workspaceName);
    localStorage.setItem('memberId', ws.memberId.toString());
    navigate('/dashboard');
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinLoading(true);
    setJoinError('');
    try {
      const res = await axios.post('http://localhost:5000/api/workspaces/join', {
        userId,
        code: joinCode
      });
      if (res.data.success) {
        setIsJoinModalOpen(false);
        setJoinCode('');
        fetchGroups();
      }
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Failed to join group.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await axios.post('http://localhost:5000/api/workspaces', {
        unitId: createData.unitId,
        groupNumber: createData.groupNumber,
        userId
      });
      if (res.data.success) {
        setIsCreateModalOpen(false);
        setCreateData({ unitId: '', groupNumber: '' });
        fetchGroups();
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent font-sans flex flex-col relative overflow-hidden">

      <div className="w-full max-w-[1600px] mx-auto px-10 pt-10 flex flex-col flex-1 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 animate-fade-in flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-3 rounded-2xl shadow-xl shadow-primary-200">
              <Monitor className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Cohort Space</h1>
              <p className="text-slate-500 font-bold text-sm tracking-tight">Welcome back, {userName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 text-xs font-black text-emerald-600 uppercase tracking-widest hover:text-white hover:bg-emerald-600 transition-all bg-white px-6 py-3.5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-emerald-200"
            >
                <Zap className="w-4 h-4" />
                <span>Create Group</span>
            </button>
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              className="flex items-center space-x-2 text-xs font-black text-primary-600 uppercase tracking-widest hover:text-white hover:bg-primary-600 transition-all bg-white px-6 py-3.5 rounded-2xl border border-primary-100 shadow-sm hover:shadow-primary-200"
            >
                <Plus className="w-4 h-4" />
                <span>Join Group</span>
            </button>
            <button 
                onClick={() => {
                    localStorage.clear();
                    navigate('/access');
                }}
                className="flex items-center space-x-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-all bg-white px-5 py-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md"
            >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Kanban Board Container */}
        <div className="flex-1 flex overflow-x-auto pb-10 space-x-10 custom-scrollbar scroll-smooth">
          {groups && Object.entries(groups).length > 0 ? (
            Object.entries(groups).map(([unitName, workspaces]) => (
              <section key={unitName} className="flex-shrink-0 w-[400px] flex flex-col animate-fade-in group/column">
                <div className="flex items-center justify-between mb-8 sticky top-0 z-20 py-2">
                  <div className="flex items-center space-x-3">
                      <div className="h-6 w-1.5 bg-primary-500 rounded-full"></div>
                      <h2 className="text-base font-black text-slate-800 tracking-tight uppercase flex items-center shadow-sm px-5 py-3 bg-white rounded-2xl border border-slate-100 ring-4 ring-slate-50">
                      <Library className="w-4 h-4 mr-3 text-primary-500" />
                      {unitName}
                      </h2>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
                      {workspaces.length} GROUPS
                  </span>
                </div>
                
                <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
                  {workspaces.map((ws) => (
                    <div 
                      key={ws.workspaceId}
                      onClick={() => enterWorkspace(ws)}
                      className="glass-card p-8 rounded-[2rem] group/card hover:scale-[1.02] cursor-pointer transition-all duration-500 bg-white/90 border border-white hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden active:scale-95"
                    >
                      {/* Background decoration */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-full blur-2xl -mr-12 -mt-12 group-hover/card:bg-primary-100 transition-colors"></div>
                      
                      <div className="relative z-10">
                        <span className="text-[9px] font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg uppercase tracking-widest mb-5 inline-block border border-primary-100">
                          {ws.code}
                        </span>
                        <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover/card:text-primary-700 transition-colors">
                          {ws.workspaceName}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Assignment Group</p>
                        
                        <div className="mt-8 flex items-center justify-between">
                           <div className="flex items-center text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Active
                           </div>
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover/card:bg-primary-600 group-hover/card:text-white transition-all duration-300 shadow-inner">
                              <ArrowRight className="w-4 h-4" />
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center py-40 animate-fade-in bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="bg-white w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-slate-100 border border-slate-50">
                    <Library className="w-10 h-10 text-primary-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Your Dashboard is Empty</h3>
                <p className="text-slate-500 font-bold mt-2 max-w-sm text-center px-4 leading-relaxed">Join a course group or create a new one to start collaborating.</p>
                <div className="flex space-x-4 mt-8">
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary-200 hover:scale-105 transition-transform"
                  >
                    Create New Group
                  </button>
                  <button 
                      onClick={() => setIsJoinModalOpen(true)}
                      className="bg-white text-primary-600 border border-primary-100 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-100 hover:scale-105 transition-transform"
                  >
                      Join Existing Group
                  </button>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Join Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsJoinModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl relative z-10 animate-modal-in border border-white">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Join Group</h2>
              <button onClick={() => setIsJoinModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400"><X /></button>
            </div>
            <form onSubmit={handleJoinByCode} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Workspace Code</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary-500 outline-none font-black uppercase transition-all"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                />
              </div>
              {joinError && <p className="text-red-500 text-[10px] font-black">{joinError}</p>}
              <button type="submit" className="w-full btn-primary py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">Access Workspace</button>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl relative z-10 animate-modal-in border border-white">
             {/* Decoration */}
             <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Deploy New Group</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Automatic Naming Enabled</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-emerald-50 hover:text-emerald-500 text-slate-400 transition-all font-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Select Course Unit</label>
                <select 
                   className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-700 transition-all shadow-inner"
                   value={createData.unitId}
                   onChange={(e) => setCreateData({...createData, unitId: e.target.value})}
                   required
                >
                  <option value="">Select Unit...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Group Number</label>
                <input 
                  type="number" 
                  placeholder="e.g. 7"
                  className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-500 outline-none font-black text-slate-800 transition-all shadow-inner"
                  value={createData.groupNumber}
                  onChange={(e) => setCreateData({...createData, groupNumber: e.target.value})}
                  required
                />
              </div>

              {createError && (
                <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-2xl text-red-600 ring-1 ring-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-tight leading-tight">{createError}</p>
                </div>
              )}

              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                 <div className="flex items-center space-x-3 text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ownership Guaranteed</span>
                 </div>
                 <p className="text-[9px] text-emerald-600 font-bold mt-2 leading-relaxed">
                   Generating this group will grant you primary access and an automatic member slot.
                 </p>
              </div>

              <button 
                type="submit"
                disabled={createLoading || !createData.unitId || !createData.groupNumber}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center space-x-3"
              >
                <span>{createLoading ? 'Deploying...' : 'Establish Workspace'}</span>
                {!createLoading && <Zap className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSelectorView;
