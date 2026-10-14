import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient, AuthState } from '../services/authClient';
import { realtimeClient } from '../services/realtimeClient';
import { ThemeMode } from '../types';
import {
  User,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Zap,
} from 'lucide-react';

interface LoginPageProps {
  theme?: ThemeMode;
  onNavigateSignup?: () => void;
  onNavigateMap?: () => void;
}

// Minimalist cart upload icon adapted to respect theme stroke
const CartUploadIcon: React.FC<{ className?: string; isDark?: boolean }> = ({
  className = 'w-14 h-14',
  isDark = false,
}) => {
  const strokeColor = isDark ? '#38bdf8' : '#0284c7';
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cart Basket */}
      <path
        d="M10 14h6l5.2 18h18.8l4.2-13.5H18"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Upward Arrow inside Cart */}
      <line
        x1="30"
        y1="25"
        x2="30"
        y2="13"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <polyline
        points="25 18 30 13 35 18"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wheels */}
      <circle cx="24" cy="38" r="2.8" stroke={strokeColor} strokeWidth="2.5" fill="none" />
      <circle cx="37" cy="38" r="2.8" stroke={strokeColor} strokeWidth="2.5" fill="none" />
    </svg>
  );
};

export const LoginPage: React.FC<LoginPageProps> = ({
  theme = 'light',
  onNavigateSignup,
  onNavigateMap,
}) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [authState, setAuthState] = useState<AuthState>(authClient.getState());
  const [username, setUsername] = useState('ramesh.varma@tsspdcl.gov.in');
  const [password, setPassword] = useState('Password123!');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = authClient.subscribe((state) => {
      setAuthState({ ...state });
    });
    return () => unsubscribe();
  }, []);

  const goToMap = () => {
    realtimeClient.setActivePage('map');
    if (onNavigateMap) onNavigateMap();
    navigate('/map');
  };

  const goToSignup = () => {
    realtimeClient.setActivePage('signup');
    if (onNavigateSignup) onNavigateSignup();
    navigate('/signup');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!username.trim() || !password) {
      setFeedback({ type: 'error', text: 'PLEASE ENTER USERNAME AND PASSWORD' });
      return;
    }

    const success = await authClient.login(username, password);
    if (success) {
      goToMap();
    } else {
      setFeedback({
        type: 'error',
        text: authState.error || 'INVALID USERNAME OR PASSWORD',
      });
    }
  };

  const handleQuickDemoLogin = (role: 'NOC_OPERATOR' | 'SECTION_ENGINEER' | 'FIELD_LINEMAN') => {
    authClient.switchDemoUser(role);
    goToMap();
  };

  return (
    <div
      className={`relative min-h-screen w-full flex items-center justify-center p-6 select-none font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Utility Header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5 font-bold tracking-tight">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm ${
              isDark ? 'bg-slate-900 border-slate-800 text-cyan-400' : 'bg-white border-slate-200 text-cyan-600'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-wide">TSSPDCL GridResQ</span>
            <span className={`text-xs block font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cybercity Operations Center
            </span>
          </div>
        </div>

        <button
          onClick={goToMap}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer shadow-sm ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
          title="Explore live grid dashboard"
        >
          <span>Live Grid</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Centered Clean Login Card */}
      <div
        className={`relative z-10 w-[480px] max-w-[94vw] rounded-3xl border shadow-xl p-8 sm:p-10 flex flex-col items-center justify-center transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {authState.isAuthenticated && authState.user ? (
          /* When Already Logged In: Show Profile Card with Continue & Logout */
          <div className="w-full flex flex-col items-center text-center space-y-6">
            <div>
              <span className="text-xs font-mono tracking-widest uppercase px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                OFFICER SESSION ACTIVE
              </span>
              <h2 className="text-2xl font-extrabold mt-3 tracking-tight">
                {authState.user.fullName}
              </h2>
              <p className={`text-sm mt-1.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {authState.user.email} &bull; {authState.user.sectionOffice}
              </p>
            </div>

            <div className="w-full space-y-3 pt-2">
              <button
                onClick={goToMap}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wider uppercase shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <span>CONTINUE TO DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => authClient.logout()}
                className={`w-full py-3 px-4 rounded-xl border font-semibold text-sm tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isDark
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>SIGN OUT / SWITCH USER</span>
              </button>
            </div>
          </div>
        ) : (
          /* Clean Minimalist Login Form */
          <div className="w-full flex flex-col items-center">
            {/* Minimalist Cart Icon */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Sign In</h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Enter your TSSPDCL operations credentials
              </p>
            </div>

            {/* Error / Feedback Notice */}
            {feedback && (
              <div
                className={`w-full mb-4 p-3 rounded-xl text-sm font-semibold text-center tracking-wide flex items-center justify-center gap-2 ${
                  feedback.type === 'error'
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300'
                    : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                }`}
              >
                {feedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="w-full flex flex-col space-y-4">
              {/* USERNAME Field */}
              <div
                className={`relative flex items-center border rounded-xl px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-cyan-500/40 ${
                  isDark
                    ? 'bg-slate-950/70 border-slate-700 focus-within:border-cyan-500'
                    : 'bg-slate-50 border-slate-300 focus-within:border-cyan-600'
                }`}
              >
                <User className={`w-5 h-5 shrink-0 mr-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  required
                  placeholder="Official Email / Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`bg-transparent w-full text-sm font-medium focus:outline-none ${
                    isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* PASSWORD Field */}
              <div
                className={`relative flex items-center border rounded-xl px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-cyan-500/40 ${
                  isDark
                    ? 'bg-slate-950/70 border-slate-700 focus-within:border-cyan-500'
                    : 'bg-slate-50 border-slate-300 focus-within:border-cyan-600'
                }`}
              >
                <Lock className={`w-5 h-5 shrink-0 mr-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`bg-transparent w-full text-sm font-medium focus:outline-none ${
                    isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* LOGIN Button */}
              <button
                type="submit"
                disabled={authState.isLoading}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wider uppercase shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-1 ${
                  isDark
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {authState.isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>LOGGING IN...</span>
                  </>
                ) : (
                  <span>LOGIN</span>
                )}
              </button>

              {/* Links below button: Forgot Password & Sign Up */}
              <div className="w-full flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={goToSignup}
                  className={`font-semibold hover:underline cursor-pointer ${
                    isDark ? 'text-cyan-400' : 'text-cyan-600'
                  }`}
                >
                  Register / Create Account
                </button>

                <button
                  type="button"
                  onClick={() =>
                    alert('TSSPDCL password recovery is managed by the Cybercity IT Section Administrator.')
                  }
                  className={`hover:underline cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  Forgot password?
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Quick Test Login Helper */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col sm:flex-row items-center justify-center gap-2.5 z-20 text-xs">
        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Quick Demo Access:</span>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('NOC_OPERATOR')}
            className={`px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all cursor-pointer shadow-sm ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-400'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            Operator Varma
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('SECTION_ENGINEER')}
            className={`px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all cursor-pointer shadow-sm ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-400'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            Section AE Reddy
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('FIELD_LINEMAN')}
            className={`px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all cursor-pointer shadow-sm ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-400'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            Lineman Ramulu
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
