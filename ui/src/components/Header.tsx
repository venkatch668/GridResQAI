import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEMO_SCENARIOS } from '../mock/scenarios';
import { realtimeClient, DashboardState } from '../services/realtimeClient';
import { authClient, AuthState } from '../services/authClient';
import { AuthModal } from './AuthModal';
import {
  Activity,
  PhoneCall,
  ShieldAlert,
  Zap,
  Radio,
  Menu,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Briefcase,
  Wrench,
  LogIn,
  UserPlus,
} from 'lucide-react';

interface HeaderProps {
  state: DashboardState;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ state, onToggleSidebar }) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>(authClient.getState());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = authClient.subscribe((newAuth) => {
      setAuthState({ ...newAuth });
    });
    return () => unsubscribe();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    realtimeClient.runScenario(e.target.value);
  };

  const handleSimulateCall = () => {
    realtimeClient.runScenario(state.currentScenario.id);
  };

  const getRoleLabel = (role?: string) => {
    if (role === 'SECTION_ENGINEER') return 'Section AE';
    if (role === 'FIELD_LINEMAN') return 'Lineman';
    return 'NOC Operator';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'OP';
    const parts = name.replace(/[^\w\s]/g, '').split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.slice(0, 2) || 'OP').toUpperCase();
  };

  const isDark = state.theme === 'dark';

  return (
    <>
      <header className={`border-b transition-colors shrink-0 sticky top-0 z-40 ${
        isDark ? 'bg-slate-900 border-slate-800 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}>
        <div className="mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Menu Button */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm font-semibold ${
                  isDark
                    ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-cyan-400'
                    : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-cyan-600'
                }`}
                title="Toggle Navigation Sidebar"
              >
                <Menu className="w-4 h-4 text-cyan-500" />
                <span>Menu</span>
              </button>
            )}

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl font-extrabold tracking-tight ${
                  isDark
                    ? 'bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent'
                    : 'text-slate-900'
                }`}>
                  GridResQ AI
                </h1>
                <span className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-xs font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                  NOC MVP
                </span>
              </div>
              <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Autonomous Outage Triage &amp; Telephony Care
              </p>
            </div>
          </div>

          {/* Controls: Scenarios, Live Transport & User Session */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Scenario Selector */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}>
              <Activity className="w-4 h-4 text-cyan-500 shrink-0" />
              <label htmlFor="scenario-select" className={`text-xs md:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Scenario:
              </label>
              <select
                id="scenario-select"
                value={state.currentScenario.id}
                onChange={handleScenarioChange}
                className={`text-xs md:text-sm font-medium rounded border px-2.5 py-1 focus:ring-1 focus:ring-cyan-500 outline-none cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 text-white border-slate-700'
                    : 'bg-white text-slate-900 border-slate-300 shadow-sm'
                }`}
              >
                {Object.values(DEMO_SCENARIOS).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Inbound Call Demo Button */}
            <button
              onClick={handleSimulateCall}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs md:text-sm font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer active:scale-95"
              title="Trigger Inbound Voice Call Demo"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Simulate Call</span>
            </button>

            {/* Realtime Transport Indicator (Live SSE) */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs md:text-sm font-medium ${
                isDark ? 'bg-slate-800/60 border-slate-700/80 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title={
                state.isLiveSocketConnected
                  ? 'Connected: Live Server-Sent Events (SSE) streaming real-time telemetry from FastAPI'
                  : 'Simulation Mode: Emulating real-time grid stream locally'
              }
            >
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline font-semibold">
                {state.isLiveSocketConnected ? 'Live SSE' : 'Mock Stream'}
              </span>
            </div>

            {/* User Account / Profile Menu */}
            {authState.user ? (
              <div className="flex items-center gap-2">
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 shadow-sm'
                    }`}
                    title="Officer Profile Menu"
                  >
                    <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs md:text-sm flex items-center justify-center shadow shrink-0">
                      {getInitials(authState.user.fullName)}
                    </div>
                    <div className="text-left hidden md:block">
                      <div className={`text-xs md:text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span className="truncate max-w-[130px]">{authState.user.fullName}</span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold px-1.5 py-0.2 rounded border border-cyan-500/30">
                          {getRoleLabel(authState.user.role)}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  {/* Dropdown Card */}
                  {isUserMenuOpen && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-2xl p-4 z-50 animate-fade-in border shadow-2xl ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    }`}>
                      <div className={`pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{authState.user.fullName}</div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">{authState.user.email}</div>
                        <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
                          <span>Office: {authState.user.sectionOffice}</span>
                          {authState.user.employeeId && (
                            <span className={`font-mono px-1.5 py-0.5 rounded text-xs ${isDark ? 'bg-slate-800' : 'bg-slate-100 text-slate-700'}`}>
                              {authState.user.employeeId}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Persona Switchers */}
                      <div className={`py-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Switch Demo Role:
                        </div>
                        <div className="space-y-1.5">
                          <button
                            onClick={() => {
                              authClient.switchDemoUser('NOC_OPERATOR');
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors cursor-pointer ${
                              authState.user.role === 'NOC_OPERATOR'
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/30'
                                : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-cyan-500" />
                              <span>Operator Ramesh Varma</span>
                            </div>
                            <span className="text-xs text-slate-400">NOC</span>
                          </button>

                          <button
                            onClick={() => {
                              authClient.switchDemoUser('SECTION_ENGINEER');
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors cursor-pointer ${
                              authState.user.role === 'SECTION_ENGINEER'
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/30'
                                : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-indigo-500" />
                              <span>K. Srinivas Reddy</span>
                            </div>
                            <span className="text-xs text-slate-400">AE</span>
                          </button>

                          <button
                            onClick={() => {
                              authClient.switchDemoUser('FIELD_LINEMAN');
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors cursor-pointer ${
                              authState.user.role === 'FIELD_LINEMAN'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30'
                                : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-emerald-500" />
                              <span>K. Ramulu</span>
                            </div>
                            <span className="text-xs text-slate-400">Lineman</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              realtimeClient.setActivePage('login');
                              navigate('/login');
                            }}
                            className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                          >
                            Officer Profile Page
                          </button>

                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              realtimeClient.setActivePage('signup');
                              navigate('/signup');
                            }}
                            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white hover:underline cursor-pointer"
                          >
                            Register New Officer
                          </button>
                        </div>

                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => {
                              authClient.logout();
                              setIsUserMenuOpen(false);
                              realtimeClient.setActivePage('login');
                              navigate('/login');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Log Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explicit ALWAYS-VISIBLE Logout Button in Top Header */}
                <button
                  onClick={() => {
                    authClient.logout();
                    realtimeClient.setActivePage('login');
                    navigate('/login');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs md:text-sm font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Sign out of current officer session"
                >
                  <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    realtimeClient.setActivePage('login');
                    navigate('/login');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs md:text-sm font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                  title="Open Sign In Page"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => {
                    realtimeClient.setActivePage('signup');
                    navigate('/signup');
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all shadow-sm cursor-pointer border ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-cyan-700 border-slate-300'
                  }`}
                  title="Open Sign Up Page"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Login & Signup Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        authState={authState}
        theme={state.theme}
      />
    </>
  );
};
