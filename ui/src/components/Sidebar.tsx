import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ActivePage, ThemeMode, CallStatus } from '../types';
import { authClient, AuthState } from '../services/authClient';
import {
  Map,
  FileText,
  Users,
  PhoneCall,
  Sparkles,
  Sun,
  Moon,
  Zap,
  Radio,
  Building2,
  LogOut,
  LogIn,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';

interface SidebarProps {
  activePage: ActivePage;
  theme: ThemeMode;
  callStatus: CallStatus;
  ticketCount: number;
  availableCrewsCount: number;
  isOpen?: boolean;
  onPageChange: (page: ActivePage) => void;
  onToggleTheme: () => void;
  onToggleSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  theme,
  callStatus,
  ticketCount,
  availableCrewsCount,
  isOpen = true,
  onPageChange,
  onToggleTheme,
  onToggleSidebar,
}) => {
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>(authClient.getState());

  useEffect(() => {
    const unsubscribe = authClient.subscribe((newAuth) => {
      setAuthState({ ...newAuth });
    });
    return () => unsubscribe();
  }, []);

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

  const navItems = [
    {
      id: 'map' as ActivePage,
      path: '/map',
      label: 'Grid Map & Hubs',
      subtitle: 'GIS Substation & DTRs',
      icon: Map,
    },
    {
      id: 'incidents' as ActivePage,
      path: '/incidents',
      label: 'Incidents',
      subtitle: `${ticketCount} Active Tickets`,
      icon: FileText,
      badge: ticketCount > 0 ? `${ticketCount}` : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    {
      id: 'crews' as ActivePage,
      path: '/crews',
      label: 'Field Crews & Dispatch',
      subtitle: `${availableCrewsCount} Ready Section Gangs`,
      icon: Users,
      badge: `${availableCrewsCount}`,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    {
      id: 'calls' as ActivePage,
      path: '/calls',
      label: 'Telephony & Live Calls',
      subtitle: 'Exotel 1912 Helpline',
      icon: PhoneCall,
      isLive: callStatus === 'IN_PROGRESS' || callStatus === 'RINGING',
    },
    {
      id: 'diagnosis' as ActivePage,
      path: '/diagnosis',
      label: 'Gemini AI Diagnosis',
      subtitle: 'Evidence-Grounded Triage',
      icon: Sparkles,
    },
    {
      id: 'login' as ActivePage,
      path: '/login',
      label: authState.user ? 'Officer Profile' : 'Sign In',
      subtitle: authState.user ? getRoleLabel(authState.user.role) : 'Officer Login',
      icon: authState.user ? ShieldCheck : LogIn,
      badge: authState.user ? 'Active' : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'signup' as ActivePage,
      path: '/signup',
      label: 'Sign Up',
      subtitle: 'Register Officer',
      icon: UserPlus,
    },
  ];

  return (
    <aside
      className={`w-64 shrink-0 flex flex-col justify-between border-r transition-all duration-300 z-30 select-none overflow-hidden ${
        isOpen ? '' : '-ml-64'
      } ${
        isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Top Branding & Close Button */}
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 border-b flex items-center justify-between gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  TSSPDCL GridResQ
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-mono">
                  HYD
                </span>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Cybercity &amp; Metro Zone
              </p>
            </div>
          </div>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-cyan-400' : 'border-slate-300 hover:bg-slate-100 text-slate-600 hover:text-cyan-600'
              }`}
              title="Close Sidebar"
            >
              <span className="text-sm font-bold">✕</span>
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-2">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === '/map' && (location.pathname === '/' || activePage === 'map'));
            const IconComponent = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  navigate(item.path);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isActive
                        ? 'bg-cyan-700/50 text-white'
                        : isDark
                        ? 'bg-slate-800 text-cyan-400'
                        : 'bg-slate-100 text-cyan-700'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm block font-semibold leading-snug">{item.label}</span>
                    <span
                      className={`text-xs block leading-tight ${
                        isActive ? 'text-cyan-100' : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.isLive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" title="Live Call Active" />
                  )}
                  {item.badge && (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls: Officer Profile, Logout, & Theme Toggle */}
      <div className={`p-3.5 border-t space-y-3 shrink-0 ${isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50'}`}>
        {/* Officer Session & Explicit Logout Section */}
        {authState.user ? (
          <div className={`p-3 rounded-2xl border flex flex-col gap-2.5 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <button
              onClick={() => {
                onPageChange('login');
                navigate('/login');
              }}
              className="flex items-center justify-between w-full text-left group cursor-pointer hover:opacity-90 transition-opacity"
              title="Click to view full Officer Profile & Session details"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm flex items-center justify-center shrink-0 shadow">
                  {getInitials(authState.user.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-sm font-bold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {authState.user.fullName}
                  </span>
                  <span className={`text-xs font-semibold block truncate ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                    {getRoleLabel(authState.user.role)} &bull; {authState.user.employeeId || 'Active'}
                  </span>
                </div>
              </div>
            </button>

            {/* PROMINENT LOGOUT BUTTON */}
            <button
              onClick={() => {
                authClient.logout();
                onPageChange('login');
                navigate('/login');
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs md:text-sm font-bold transition-all cursor-pointer active:scale-98"
              title="End session and log out"
            >
              <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          /* When Logged Out: Prompt to Sign In or Sign Up */
          <div className={`p-3 rounded-2xl border flex flex-col gap-2.5 ${
            isDark ? 'bg-slate-900/90 border-cyan-500/20' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Guest Mode</span>
              </span>
              <span className="text-amber-500 font-bold">Signed Out</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onPageChange('login');
                  navigate('/login');
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs md:text-sm font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
                title="Open Sign In Page"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => {
                  onPageChange('signup');
                  navigate('/signup');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer border ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-cyan-800 border-slate-300'
                }`}
                title="Open Sign Up Page"
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </button>
            </div>
          </div>
        )}

        {/* Portal Status indicator */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <Building2 className="w-4 h-4 text-cyan-500" />
            <span>TSSPDCL Section Portal</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-500 font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Online</span>
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs md:text-sm font-bold transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
              : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 shadow-sm'
          }`}
          title="Toggle Dark / Light Theme"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Switch to Light Theme</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Switch to Dark Theme</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
