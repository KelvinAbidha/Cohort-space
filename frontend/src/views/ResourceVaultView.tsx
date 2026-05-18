import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Database, 
  Plus, 
  Search, 
  FileText, 
  Link as LinkIcon, 
  ExternalLink,
  X,
  Trash2,
  Filter,
  ChevronDown,
  Globe,
  FileBox
} from 'lucide-react';

interface Resource {
  id: number;
  title: string;
  url: string;
  type: string;
  createdAt: string;
  uploadedBy: { name: string };
}

const ResourceVaultView: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [newResource, setNewResource] = useState({
    title: '',
    url: '',
    type: 'Link',
    uploadedById: ''
  });
  const workspaceId = localStorage.getItem('workspaceId');

  const fetchResources = useCallback(async () => {
    try {
      const res = await axios.get(`/api/resources?workspaceId=${workspaceId}`);
      setResources(res.data);
    } catch (err) {
      console.error('Error fetching resources', err);
    }
  }, [workspaceId]);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await axios.get(`/api/meta?workspaceId=${workspaceId}`);
      setMembers(res.data.members);
    } catch (err) {
      console.error('Error fetching meta', err);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchResources();
    fetchMeta();
  }, [fetchResources, fetchMeta]);

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

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/resources', {
        ...newResource,
        workspaceId
      });
      setShowModal(false);
      setNewResource({ title: '', url: '', type: 'Link', uploadedById: '' });
      fetchResources();
    } catch (err) {
      console.error('Error adding resource', err);
    }
  };

  const handleDeleteResource = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this resource?')) return;
    try {
      await axios.delete(`/api/resources/${id}`);
      fetchResources();
    } catch (err) {
      console.error('Error deleting resource', err);
    }
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || res.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-fade-in relative z-10 transition-all duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Resource Vault</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-lg mt-1">Shared project documentation and external assets</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center space-x-3 px-10 shadow-2xl shadow-primary-200 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Resource</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white/40 dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/60 dark:border-white/5 backdrop-blur-xl shadow-sm transition-all">
        <div className="flex-1 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full max-w-3xl">
           <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by title..."
              className="w-full pl-11 pr-4 py-4 bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:border-primary-400 outline-none transition-all font-bold text-sm shadow-inner dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
            <select 
              className="w-full sm:w-auto pl-11 pr-10 py-4 bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-700 dark:text-slate-300 appearance-none shadow-inner"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All" className="dark:bg-slate-900">All Assets</option>
              <option value="Link" className="dark:bg-slate-900">Web Links</option>
              <option value="Document" className="dark:bg-slate-900">Documents</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-6 py-4 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all">
           {filteredResources.length} items discovered
        </div>
      </div>

      <div className="glass-card rounded-[3rem] overflow-hidden border border-white/40 dark:border-white/5 transition-all">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] border-b border-slate-100 dark:border-slate-800 transition-colors">
                <th className="px-10 py-6">Asset Detail</th>
                <th className="px-10 py-6">Classification</th>
                <th className="px-10 py-6">Contributor</th>
                <th className="px-10 py-6 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50 bg-white/10 dark:bg-slate-900/10">
              {filteredResources.map(res => (
                <tr key={res.id} className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300 group">
                  <td className="px-10 py-8">
                    <div className="flex items-center space-x-6">
                      <div className={`p-4 rounded-2xl shadow-xl transition-all group-hover:scale-110 group-hover:rotate-3 ${
                        res.type === 'Document' ? 'bg-amber-500 shadow-amber-200 dark:shadow-none' : 'bg-emerald-500 shadow-emerald-200 dark:shadow-none'
                      }`}>
                        {res.type === 'Document' ? <FileText className="w-6 h-6 text-white" /> : <LinkIcon className="w-6 h-6 text-white" />}
                      </div>
                      <a 
                        href={res.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:opacity-80 transition-opacity block truncate max-w-md"
                      >
                        <p className="text-[15px] font-black text-slate-800 dark:text-white tracking-tight hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{res.title}</p>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1 truncate flex items-center tracking-wide">
                          {res.type === 'Link' ? <Globe className="w-3 h-3 mr-1.5" /> : <FileBox className="w-3 h-3 mr-1.5" />}
                          {res.url}
                        </p>
                      </a>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`text-[10px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-widest border transition-colors ${
                      res.type === 'Document' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                    }`}>
                      {res.type}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center text-[11px] font-black text-primary-600 dark:text-primary-400 shadow-inner">
                        {(res.uploadedBy?.name?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight leading-none">{res.uploadedBy?.name || 'Anonymous'}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 leading-none">
                          {new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end space-x-4">
                       <button 
                        onClick={() => handleDeleteResource(res.id)}
                        className="opacity-0 group-hover:opacity-100 p-3 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <a 
                        href={res.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-12 h-12 text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-800 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500 rounded-2xl transition-all shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 ring-2 ring-transparent hover:ring-primary-100 dark:hover:ring-primary-900/30"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredResources.length === 0 && (
            <div className="p-32 flex flex-col items-center justify-center text-center opacity-40 dark:opacity-30">
              <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] mb-6 border border-slate-100 dark:border-slate-700">
                <Database className="w-16 h-16 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-xl font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Vault Registry Empty</p>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-3 tracking-wide">No assets found matching your current filter</p>
            </div>
          )}
        </div>
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
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Vault Deposit</h2>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Resource Archive</p>
              </div>
               <button 
                onClick={() => setShowModal(false)} 
                className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Asset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Specification Doc"
                  className="w-full px-6 py-4.5 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:border-primary-500 outline-none font-black text-slate-800 dark:text-white text-sm transition-all shadow-inner bg-slate-50/50 dark:bg-slate-950/50"
                  value={newResource.title}
                  onChange={e => setNewResource({...newResource, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Direct URL / Cloud Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/..."
                  className="w-full px-6 py-4.5 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 focus:border-primary-500 outline-none font-black text-slate-800 dark:text-white text-sm transition-all shadow-inner bg-slate-50/50 dark:bg-slate-950/50"
                  value={newResource.url}
                  onChange={e => setNewResource({...newResource, url: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Asset Type</label>
                  <select 
                    className="w-full px-5 py-4.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 shadow-inner appearance-none"
                    value={newResource.type}
                    onChange={e => setNewResource({...newResource, type: e.target.value})}
                  >
                    <option value="Link" className="dark:bg-slate-900">🔗 Web Link</option>
                    <option value="Document" className="dark:bg-slate-900">📄 Document</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Author</label>
                  <select 
                    className="w-full px-5 py-4.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 shadow-inner appearance-none"
                    value={newResource.uploadedById}
                    onChange={e => setNewResource({...newResource, uploadedById: e.target.value})}
                    required
                  >
                    <option value="" className="dark:bg-slate-900">Select...</option>
                    {members.map(m => <option key={m.id} value={m.id} className="dark:bg-slate-900">{m.name}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-5 rounded-2xl mt-4 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary-200 dark:shadow-none">
                Deposit to Vault
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceVaultView;
