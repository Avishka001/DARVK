import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, AlertCircle, ShieldCheck, Zap, Key } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useGoogleLogin } from '@react-oauth/google';
import * as api from '../api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const { loginUser, signupUser, googleLogin } = useUser();
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [resetSent, setResetSent] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setOtp('');
    setError('');
  };

  const switchTab = (tab: 'login' | 'signup' | 'forgot' | 'reset') => {
    setActiveTab(tab);
    setResetSent(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (activeTab === 'forgot') {
      try {
        const res = await api.forgotPassword(email);
        if (res.success) {
          setActiveTab('reset');
        } else {
          setError(res.message || 'Failed to send reset code');
          setShake(true);
          setTimeout(() => setShake(false), 600);
        }
      } catch (err: any) {
        setError(err.message || 'Error processing request');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
      setIsLoading(false);
      return;
    }

    if (activeTab === 'reset') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        setShake(true);
        setTimeout(() => setShake(false), 600);
        return;
      }
      try {
        const res = await api.resetPassword({ email, otp, newPassword: password });
        if (res.success) {
          setResetSent(true); // Re-use this state to show a success message
          setTimeout(() => {
            switchTab('login');
          }, 3000);
        } else {
          setError(res.message || 'Failed to reset password');
          setShake(true);
          setTimeout(() => setShake(false), 600);
        }
      } catch (err: any) {
        setError(err.message || 'Error processing request');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
      setIsLoading(false);
      return;
    }

    let ok = false;
    if (activeTab === 'login') {
      ok = await loginUser({ email, password });
    } else {
      if (!firstName || !lastName) {
        setError('First and last name are required for signup.');
        setIsLoading(false);
        setShake(true);
        setTimeout(() => setShake(false), 600);
        return;
      }
      ok = await signupUser({ email, password, firstName, lastName });
    }

    if (ok) {
      setTimeout(() => {
        setIsLoading(false);
        resetForm();
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          onClose();
        }
      }, 400);
    } else {
      setIsLoading(false);
      setError(activeTab === 'login' ? 'Invalid credentials.' : 'Signup failed. Email might be in use.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        const ok = await googleLogin({
          email: userInfo.email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          googleId: userInfo.sub,
        });

        if (ok) {
          setIsLoading(false);
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            onClose();
          }
        } else {
          setIsLoading(false);
          setError('Google Login failed on our end.');
        }
      } catch (err) {
        setIsLoading(false);
        setError('Failed to fetch Google profile.');
      }
    },
    onError: () => {
      setError('Google Login failed or was cancelled.');
    }
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
          />

          <div className="fixed inset-0 z-[201] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={shake
                ? { opacity: 1, scale: 1, y: 0, x: [0, -10, 10, -7, 7, -3, 0] }
                : { opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 pt-6 pb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-wider uppercase text-white">
                    {activeTab === 'login' ? 'Welcome Back' 
                     : activeTab === 'signup' ? 'Create Account' 
                     : activeTab === 'forgot' ? 'Reset Password' 
                     : 'Set New Password'}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    {activeTab === 'login' ? 'Sign in to access your orders' 
                     : activeTab === 'signup' ? 'Join Aura for exclusive perks' 
                     : activeTab === 'forgot' ? 'We will send you a reset link' 
                     : 'Enter your reset code and new password'}
                  </p>
                </div>
                <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activeTab !== 'forgot' && activeTab !== 'reset' && (
                <div className="flex px-6 mb-4 space-x-4 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    className={`pb-2 text-xs font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'login' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    Log In
                    {activeTab === 'login' && (
                      <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab('signup')}
                    className={`pb-2 text-xs font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'signup' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    Sign Up
                    {activeTab === 'signup' && (
                      <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
                    )}
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="px-6 py-2 space-y-4">
                {activeTab === 'signup' && (
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 block mb-1.5 uppercase">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 focus:border-white focus:outline-none px-3 py-2.5 text-xs rounded-lg text-white placeholder-white/20 transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 block mb-1.5 uppercase">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 focus:border-white focus:outline-none px-3 py-2.5 text-xs rounded-lg text-white placeholder-white/20 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {(activeTab === 'login' || activeTab === 'signup' || activeTab === 'forgot' || activeTab === 'reset') && (
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 block mb-1.5 uppercase">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-600" />
                      <input
                        type="email"
                        required
                        readOnly={activeTab === 'reset'}
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 focus:border-white focus:outline-none pl-9 pr-4 py-2.5 text-xs rounded-lg text-white placeholder-white/20 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'reset' && (
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 block mb-1.5 uppercase">
                      6-Digit Reset Code
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 w-4 h-4 text-neutral-600" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 focus:border-white focus:outline-none pl-9 pr-4 py-2.5 text-xs rounded-lg text-white placeholder-white/20 transition-colors tracking-widest text-center font-mono"
                      />
                    </div>
                  </div>
                )}

                {activeTab !== 'forgot' && (
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 block mb-1.5 uppercase">
                      {activeTab === 'reset' ? 'New Password' : 'Password'}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-600" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 focus:border-white focus:outline-none pl-9 pr-4 py-2.5 text-xs rounded-lg text-white placeholder-white/20 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'reset' && (
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 block mb-1.5 uppercase">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-600" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 focus:border-white focus:outline-none pl-9 pr-4 py-2.5 text-xs rounded-lg text-white placeholder-white/20 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => switchTab('forgot')}
                      className="text-[10px] font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-widest"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span className="text-[10px] text-red-400 font-bold tracking-wider uppercase">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {activeTab === 'reset' && resetSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center"
                  >
                    <ShieldCheck className="w-6 h-6 text-emerald-500 mb-2" />
                    <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase mb-1">Password Reset!</span>
                    <span className="text-[10px] text-neutral-400">You can now login with your new password.</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-black tracking-[0.2em] text-xs flex items-center justify-center space-x-2 transition-all uppercase rounded-lg cursor-pointer mt-2"
                >
                  {isLoading ? 'Processing...' : (
                    activeTab === 'login' ? 'Log In' : 
                    activeTab === 'signup' ? 'Sign Up' : 
                    activeTab === 'forgot' ? 'Send Code' : 
                    'Reset Password'
                  )}
                </button>

                {(activeTab === 'forgot' || activeTab === 'reset') && (
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    className="w-full py-3 border border-white/20 hover:bg-white/5 text-white font-black tracking-[0.2em] text-xs flex items-center justify-center space-x-2 transition-all uppercase rounded-lg cursor-pointer mt-2"
                  >
                    Return to Login
                  </button>
                )}
              </form>

              {activeTab !== 'forgot' && activeTab !== 'reset' && (
                <div className="px-6 pb-6">
                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-neutral-600 text-[10px] uppercase tracking-widest">or</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={isLoading}
                  className="w-full py-3 bg-[#050505] border border-white/10 hover:bg-[#111] hover:border-white/30 text-white font-bold text-xs flex items-center justify-center space-x-3 transition-all rounded-lg cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
              )}

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
