import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Columns3, 
  Database, 
  LogOut, 
  ChevronRight,
  Monitor,
  LayoutGrid,
  Trash2
} from 'lucide-react';
import axios from 'axios';

// Views
import WorkspaceAccess from './views/WorkspaceAccess.tsx';
import DashboardView from './views/DashboardView.tsx';
import TaskBoardView from './views/TaskBoardView.tsx';
import ResourceVaultView from './views/ResourceVaultView.tsx';
import WorkspaceSelectorView from './views/WorkspaceSelectorView.tsx';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const workspaceName = localStorage.getItem('workspaceName');
  const userName = localStorage.getItem('userName');
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/access');
  };

  const handleDestroyWorkspace = async () => {
    const workspaceId = localStorage.getItem('workspaceId');
    if (!window.confirm("CRITICAL WARNING: This will permanently delete the workspace and all its content (tasks, resources, milestones) for ALL members. This cannot be undone. Proceed?")) return;
    if (!window.confirm("SECOND CONFIRMATION: Are you absolutely certain you want to destroy this workspace?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/workspaces/${workspaceId}`);
      localStorage.clear();
      navigate('/access');
    } catch (err) {
      console.error('Error destroying workspace', err);
      alert('Action failed. You might not have permission or there was a server error.');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Task Board', path: '/tasks', icon: Columns3 },
    { name: 'Resource Vault', path: '/resources', icon: Database },
    { name: 'My Groups', path: '/selector', icon: LayoutGrid },
  ];

  const currentPathName = navItems.find(n => n.path === location.pathname)?.name || 'Home';

  return (
    <div className="flex h-screen bg-transparent font-sans overflow-hidden">
      {/* Sidebar - Solid and Professional */}
      <aside className="w-80 glass-sidebar flex flex-col z-20">
        <div className="p-10">
          <div className="flex items-center space-x-4 mb-14">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-3 rounded-[1.25rem] shadow-xl shadow-primary-100">
              <Monitor className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">Cohort Space</span>
          </div>
          
          <nav className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link group ${isActive ? 'active shadow-lg shadow-slate-200/50' : ''}`}
                >
                  <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="font-bold tracking-tight">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto p-10 border-t border-slate-100/50 space-y-2">
          <button 
            onClick={handleDestroyWorkspace}
            className="flex items-center space-x-4 text-slate-300 hover:text-red-600 transition-all duration-300 w-full px-6 py-4 rounded-2xl hover:bg-red-50 font-black text-[10px] uppercase tracking-widest group border border-transparent hover:border-red-100"
          >
            <Trash2 className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            <span>Destroy Workspace</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-4 text-slate-400 hover:text-slate-900 transition-all duration-300 w-full px-6 py-4 rounded-2xl hover:bg-slate-100 font-bold group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="tracking-tight">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar flex flex-col">
        
        <header className="h-28 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-12 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <div className="bg-slate-100/80 px-4 py-2.5 rounded-2xl border border-slate-200/50">
               <span className="font-black text-slate-800 text-sm tracking-tight">{workspaceName}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] bg-primary-50 px-3 py-1.5 rounded-lg">
              {currentPathName}
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 bg-white/80 p-2.5 pr-6 rounded-2xl border border-white shadow-xl shadow-slate-200/40">
               <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-primary-200">
                  {(userName?.[0] || '?').toUpperCase()}
               </div>
               <div className="flex flex-col -space-y-1">
                  <span className="text-sm font-black text-slate-900 tracking-tight">{userName}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{localStorage.getItem('regNumber')}</span>
               </div>
            </div>
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto w-full flex-1 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const userId = localStorage.getItem('userId');
  if (!userId) return <Navigate to="/access" />;
  return <>{children}</>;
};

// Layout specifically for groups that are already selected
const DynamicLayout: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const workspaceId = localStorage.getItem('workspaceId');
    if (!workspaceId) return <Navigate to="/selector" />;
    return <MainLayout>{children}</MainLayout>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/access" element={<WorkspaceAccess />} />
        <Route path="/selector" element={<ProtectedRoute><WorkspaceSelectorView /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DynamicLayout><DashboardView /></DynamicLayout></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><DynamicLayout><TaskBoardView /></DynamicLayout></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><DynamicLayout><ResourceVaultView /></DynamicLayout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/selector" />} />
      </Routes>
    </Router>
  );
}

export default App;
