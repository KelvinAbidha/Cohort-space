import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Columns3, 
  Database, 
  LogOut, 
  ChevronRight,
  Monitor,
  LayoutGrid,
  Trash2,
  PieChart,
  Menu,
  ChevronLeft
} from 'lucide-react';
import axios from 'axios';

// Views
import WorkspaceAccess from './views/WorkspaceAccess.tsx';
import DashboardView from './views/DashboardView.tsx';
import TaskBoardView from './views/TaskBoardView.tsx';
import ResourceVaultView from './views/ResourceVaultView.tsx';
import WorkspaceSelectorView from './views/WorkspaceSelectorView.tsx';
import ThemeToggle from './components/ThemeToggle.tsx';
import ReportsView from './views/ReportsView.tsx';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const workspaceName = localStorage.getItem('workspaceName');
  const userName = localStorage.getItem('userName');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
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
    { name: 'Analytics & Reports', path: '/reports', icon: PieChart },
    { name: 'My Groups', path: '/selector', icon: LayoutGrid },
  ];

  const currentPathName = navItems.find(n => n.path === location.pathname)?.name || 'Home';

  return (
    <div className="flex h-screen bg-transparent font-sans overflow-hidden transition-colors duration-500">
      {/* Sidebar - Solid and Professional */}
      <aside className={`${isSidebarCollapsed ? 'w-24' : 'w-80'} transition-all duration-500 ease-in-out glass-sidebar flex flex-col z-40 print:hidden relative group/sidebar border-r border-white/20 dark:border-white/5`}>
        {/* Toggle Button Inside Sidebar */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`absolute -right-4 top-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-2 shadow-2xl z-50 transition-all duration-500 hover:scale-110 text-slate-400 hover:text-primary-600 opacity-0 group-hover/sidebar:opacity-100 ring-4 ring-transparent hover:ring-primary-50 dark:hover:ring-primary-900/20`}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={`${isSidebarCollapsed ? 'p-6' : 'p-10'} transition-all duration-500`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center mb-10' : 'space-x-4 mb-14'}`}>
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-3.5 rounded-2xl shadow-2xl shadow-primary-200 dark:shadow-none flex-shrink-0 transition-transform hover:rotate-3">
              <Monitor className="text-white w-6 h-6" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col -space-y-1 animate-fade-in">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter whitespace-nowrap">Cohort Space</span>
                <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.3em]">Intelligence</span>
              </div>
            )}
          </div>
          
          <nav className="space-y-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link group ${isActive ? 'active shadow-xl shadow-slate-200/50 dark:shadow-none' : ''} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                  title={isSidebarCollapsed ? item.name : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:scale-110'}`} />
                  {!isSidebarCollapsed && <span className="font-black tracking-tight whitespace-nowrap animate-fade-in text-sm uppercase tracking-widest">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className={`mt-auto ${isSidebarCollapsed ? 'p-6' : 'p-10'} border-t border-slate-100/50 dark:border-slate-800/50 space-y-3 transition-all duration-500`}>
          <button 
            onClick={handleDestroyWorkspace}
            className={`flex items-center text-slate-300 hover:text-red-600 transition-all duration-300 w-full rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/30 font-black text-[10px] uppercase tracking-[0.2em] group border border-transparent hover:border-red-100 dark:hover:border-red-900/50 ${isSidebarCollapsed ? 'justify-center p-4' : 'space-x-4 px-6 py-4'}`}
            title={isSidebarCollapsed ? "Destroy Workspace" : ""}
          >
            <Trash2 className="w-5 h-5 opacity-50 group-hover:opacity-100 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {!isSidebarCollapsed && <span>Destroy Workspace</span>}
          </button>
          <button 
            onClick={handleLogout}
            className={`flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-300 w-full rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-black text-[10px] uppercase tracking-[0.2em] group ${isSidebarCollapsed ? 'justify-center p-4' : 'space-x-4 px-6 py-4'}`}
            title={isSidebarCollapsed ? "Sign Out" : ""}
          >
            <LogOut className={`w-5 h-5 flex-shrink-0 ${!isSidebarCollapsed ? 'group-hover:-translate-x-1' : ''} transition-transform`} />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar flex flex-col print:overflow-visible print:block transition-all duration-500">
        
        <header className="h-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-10 sticky top-0 z-30 print:hidden transition-all duration-500">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-slate-500 hover:text-primary-600 transition-all duration-300 border border-transparent hover:border-primary-100 dark:hover:border-primary-900/50 shadow-sm"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="bg-slate-100/80 dark:bg-slate-800/80 px-5 py-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                 <span className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-tight">{workspaceName}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.3em] bg-primary-50 dark:bg-primary-900/30 px-4 py-2 rounded-xl whitespace-nowrap border border-primary-100/50 dark:border-primary-900/50 shadow-sm">
                {currentPathName}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            <ThemeToggle />
            <div className="flex items-center space-x-5 bg-white/80 dark:bg-slate-800/80 p-2 pr-8 rounded-[1.5rem] border border-white dark:border-white/5 shadow-2xl shadow-slate-200/40 dark:shadow-none transition-all group cursor-default">
               <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-sm font-black text-white shadow-xl shadow-primary-200 dark:shadow-none flex-shrink-0 group-hover:scale-105 transition-transform">
                  {(userName?.[0] || '?').toUpperCase()}
               </div>
               <div className="flex flex-col -space-y-0.5">
                  <span className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight leading-none">{userName}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">{localStorage.getItem('regNumber')}</span>
               </div>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto w-full flex-1 animate-fade-in transition-all duration-500">
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
        <Route path="/reports" element={<ProtectedRoute><DynamicLayout><ReportsView /></DynamicLayout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/selector" />} />
      </Routes>
    </Router>
  );
}

export default App;
