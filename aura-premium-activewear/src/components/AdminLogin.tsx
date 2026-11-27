import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, ShieldCheck, AlertCircle, Eye, EyeOff, Zap } from 'lucide-react';
import { DarvkLogo } from './DarvkLogo';

interface AdminLoginProps {
  onLogin: () => void;
}

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'yasas';

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsLoading(true);
      setTimeout(() => {
        onLogin();
      }, 1200);
    } else {
      setError('Invalid credentials. Access denied.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center overflow-hidden">

      {/* Animated Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Red glow orb top-left */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      {/* Subtle glow orb bottom-right */}
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-sm mx-4"
      >
        {/* Top accent bar */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent rounded-full mb-0" />

        <motion.div
          animate={isShaking ? {
            x: [0, -10, 10, -8, 8, -4, 4, 0],
            transition: { duration: 0.5 },
          } : {}}
          className="bg-[#0c0c0c] border border-white/8 rounded-b-xl shadow-2xl overflow-hidden"
        >
          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/5">
            <div className="flex items-center justify-between mb-6">
              <DarvkLogo className="h-5" />
              <span className="text-[9px] font-mono font-bold text-red-500/80 tracking-[0.25em] uppercase bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-sm">
                ADMIN
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-wider uppercase text-white">
                  Admin Portal
                </h1>
                <p className="text-[10px] text-neutral-500 tracking-widest uppercase font-mono mt-0.5">
                  Restricted Access Only
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">

            {/* Username */}
            <div>
              <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 block mb-2 uppercase">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-600" />
                <input
                  id="admin-username-input"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  autoComplete="off"
                  className="w-full bg-[#050505] border border-white/8 focus:border-red-600/60 focus:outline-none pl-10 pr-4 py-3 text-xs rounded-lg tracking-wider font-semibold text-white placeholder-white/15 transition-colors"
                  style={{ fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 block mb-2 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-600" />
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  className="w-full bg-[#050505] border border-white/8 focus:border-red-600/60 focus:outline-none pl-10 pr-10 py-3 text-xs rounded-lg tracking-widest font-mono text-white placeholder-white/15 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-neutral-600 hover:text-neutral-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <span className="text-[10px] text-red-400 font-bold tracking-wider uppercase">
                    {error}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-black tracking-[0.2em] text-xs flex items-center justify-center space-x-2.5 transition-all uppercase rounded-lg shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>ACCESS PORTAL</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-7 flex items-center justify-center space-x-2 text-[9px] text-neutral-600 font-mono tracking-widest uppercase">
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            <span>DARVK SECURE ADMIN GATEWAY v2.0</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
