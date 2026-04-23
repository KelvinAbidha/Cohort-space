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
      const res = await axios.get(`http://localhost:5000/api/resources?workspaceId=${workspaceId}`);
      setResources(res.data);
    } catch (err) {
      console.error('Error fetching resources', err);
    }
  }, [workspaceId]);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/meta?workspaceId=${workspaceId}`);
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
      await axios.post('http://localhost:5000/api/resources', {
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
      await axios.delete(`http://localhost:5000/api/resources/${id}`);
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
    <div className="space-y-6 animate-fade-in relative z-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Resource Vault</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Shared project documentation and external assets</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center space-x-2 px-8 shadow-xl shadow-primary-100 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">Add Resource</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/40 p-3 rounded-2xl border border-white/60 backdrop-blur-sm shadow-sm">
        <div className="flex-1 flex items-center space-x-3 w-full">
           <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by title..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all font-medium text-sm shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-500" />
            <select 
              className="pl-10 pr-10 py-2.5 bg-white border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none transition-all font-bold text-[10px] uppercase tracking-widest text-slate-700 appearance-none shadow-inner"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Assets</option>
              <option value="Link">Web Links</option>
              <option value="Document">Documents</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-50/50 rounded-xl border border-slate-100">
           {filteredResources.length} items discovered
        </div>
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40">
        <div className="w-full">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="bg-slate-50/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5 w-1/2">Asset Detail</th>
                <th className="px-8 py-5 w-1/6">Classification</th>
                <th className="px-8 py-5 w-1/4">Contributor</th>
                <th className="px-8 py-5 w-1/12 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 bg-white/20">
              {filteredResources.map(res => (
                <tr key={res.id} className="hover:bg-white/40 transition-all duration-300 group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl shadow-sm text-white transition-all group-hover:scale-110 ${
                        res.type === 'Document' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}>
                        {res.type === 'Document' ? <FileText className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                      </div>
                      <a 
                        href={res.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:opacity-80 transition-opacity block truncate"
                      >
                        <p className="text-sm font-black text-slate-800 tracking-tight hover:text-primary-600 transition-colors">{res.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 line-clamp-1 max-w-xs mt-0.5 truncate flex items-center">
                          {res.type === 'Link' ? <Globe className="w-2.5 h-2.5 mr-1" /> : <FileBox className="w-2.5 h-2.5 mr-1" />}
                          {res.url}
                        </p>
                      </a>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${
                      res.type === 'Document' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {res.type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-[10px] font-black text-primary-600 shadow-sm">
                        {(res.uploadedBy?.name?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 tracking-tight">{res.uploadedBy?.name || 'Anonymous'}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                          {new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                       <button 
                        onClick={() => handleDeleteResource(res.id)}
                        className="opacity-0 group-hover:opacity-100 p-2.5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <a 
                        href={res.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 text-primary-600 bg-white hover:bg-primary-600 hover:text-white rounded-xl transition-all shadow-md shadow-slate-200/50 border border-slate-100 ring-1 ring-primary-50"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredResources.length === 0 && (
             <div className="p-20 flex flex-col items-center justify-center text-center opacity-30">
                <Database className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">Vault Registry Empty</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">No assets found matching your current filter</p>
             </div>
          )}
        </div>
      </div>

      {/* Modal - Compact & Standardized */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 animate-modal-in border border-white relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
             {/* Top decorative bar */}
             <div className="absolute top-0 left-0 right-0 h-1 bg-primary-600"></div>

            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tighter">Vault Deposit</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Add Resource</p>
              </div>
               <button 
                onClick={() => setShowModal(false)} 
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Charter V1"
                  className="w-full px-5 py-3.5 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none font-bold text-slate-800 text-sm transition-all shadow-inner bg-slate-50/50"
                  value={newResource.title}
                  onChange={e => setNewResource({...newResource, title: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Direct URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://cloud-storage.com/file"
                  className="w-full px-5 py-3.5 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none font-bold text-slate-800 text-sm transition-all shadow-inner bg-slate-50/50"
                  value={newResource.url}
                  onChange={e => setNewResource({...newResource, url: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Type</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 shadow-inner appearance-none"
                    value={newResource.type}
                    onChange={e => setNewResource({...newResource, type: e.target.value})}
                  >
                    <option value="Link">🔗 External Link</option>
                    <option value="Document">📄 Document</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Author</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 shadow-inner appearance-none"
                    value={newResource.uploadedById}
                    onChange={e => setNewResource({...newResource, uploadedById: e.target.value})}
                    required
                  >
                    <option value="">Select...</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-4 rounded-xl mt-2 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary-200">
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
