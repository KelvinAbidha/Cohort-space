import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Monitor, Lock, ArrowRight, AlertCircle, Bookmark, User } from 'lucide-react';

const WorkspaceAccess: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isRegistering ? 'register' : 'login';
    const payload = isRegistering ? { name, regNumber, pin } : { regNumber, pin };

    try {
      const response = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, payload);

      if (response.data.success) {
        localStorage.setItem('userId', response.data.userId.toString());
        localStorage.setItem('userName', response.data.name);
        localStorage.setItem('regNumber', response.data.regNumber);
        navigate('/selector');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `${isRegistering ? 'Registration' : 'Login'} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-2 relative overflow-hidden">
 
      <div className="max-w-[400px] w-full z-10 animate-fade-in py-1">
        <div className="text-center mb-3">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 shadow shadow-primary-200 ring-2 ring-primary-50">
            <Monitor className="text-white w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1">Cohort Space</h1>
          <p className="text-slate-400 font-bold tracking-[0.2em] uppercase text-[8px] opacity-70">Assignment Hub</p>
        </div>
 
        <div className="glass-card p-5 rounded-3xl bg-white/80 border border-white shadow-xl shadow-slate-200/50">
          <div className="mb-4 text-center">
            <h2 className="text-base font-black text-slate-800 tracking-tight">
              {isRegistering ? 'Create Account' : 'Student Login'}
            </h2>
          </div>
 
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {isRegistering && (
              <div className="space-y-1 animate-slide-down">
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100/50 outline-none transition-all font-bold text-slate-800 text-[11px]"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}
 
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Reg Number</label>
              <div className="relative">
                <Bookmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100/50 outline-none transition-all uppercase font-black text-slate-800 text-[11px]"
                  placeholder="SCT212-0001/2024"
                  required
                />
              </div>
            </div>
 
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Personal PIN</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100/50 outline-none transition-all font-bold tracking-[0.5em] text-[11px]"
                  placeholder="••••"
                  maxLength={4}
                  required
                />
              </div>
            </div>
 
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-xl text-[8px] font-black ring-1 ring-red-100 uppercase tracking-wider">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
 
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-xl flex items-center justify-center space-x-2 mt-1 shadow-md shadow-primary-200"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] font-black leading-none">
                {loading ? 'Wait...' : (isRegistering ? 'Sign Up' : 'Sign In')}
              </span>
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>
 
          <div className="mt-4 text-center">
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-[8px] font-black text-primary-600 uppercase tracking-[0.15em] hover:text-primary-700 transition-colors border-b border-primary-100 pb-0.5"
            >
              {isRegistering ? 'Got an account? Login' : "New student? Create account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceAccess;
