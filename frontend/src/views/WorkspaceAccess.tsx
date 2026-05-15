import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Monitor, Lock, ArrowRight, AlertCircle, Bookmark, User } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle.tsx';

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
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
 
      <div className="max-w-[420px] w-full z-10 animate-fade-in py-1">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-primary-200 dark:shadow-primary-900/40 ring-4 ring-primary-50 dark:ring-primary-900/20">
            <Monitor className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">Cohort Space</h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold tracking-[0.3em] uppercase text-[9px] opacity-80">Assignment Hub</p>
        </div>
 
        <div className="glass-card p-8 rounded-[2.5rem]">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {isRegistering ? 'Create Account' : 'Student Login'}
            </h2>
          </div>
 
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-100/50 dark:focus:ring-primary-900/30 outline-none transition-all font-bold text-slate-800 dark:text-slate-200 text-xs"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}
 
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Reg Number</label>
              <div className="relative">
                <Bookmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-100/50 dark:focus:ring-primary-900/30 outline-none transition-all uppercase font-black text-slate-800 dark:text-slate-200 text-xs"
                  placeholder="SCT212-0001/2024"
                  required
                />
              </div>
            </div>
 
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Personal PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-100/50 dark:focus:ring-primary-900/30 outline-none transition-all font-bold tracking-[0.5em] text-slate-800 dark:text-slate-200 text-xs"
                  placeholder="••••"
                  maxLength={4}
                  required
                />
              </div>
            </div>
 
            {error && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-2xl text-[10px] font-black ring-1 ring-red-100 dark:ring-red-900/50 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
 
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center space-x-2 mt-2"
            >
              <span className="text-xs uppercase tracking-[0.2em] font-black leading-none">
                {loading ? 'Wait...' : (isRegistering ? 'Sign Up' : 'Sign In')}
              </span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
 
          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.15em] hover:text-primary-700 dark:hover:text-primary-300 transition-colors border-b border-primary-100 dark:border-primary-900/50 pb-0.5"
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
