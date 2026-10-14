import React, { useState } from 'react';
import { authClient, AuthState } from '../services/authClient';
import { ThemeMode } from '../types';
import {
  X,
  Lock,
  Mail,
  User,
  Shield,
  Briefcase,
  Phone,
  Building,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authState: AuthState;
  theme?: ThemeMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  authState,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('ramesh.varma@tsspdcl.gov.in');
  const [loginPassword, setLoginPassword] = useState('Password123!');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('+91 94906 ');
  const [signupEmpId, setSignupEmpId] = useState('');
  const [signupRole, setSignupRole] = useState<'NOC_OPERATOR' | 'SECTION_ENGINEER' | 'FIELD_LINEMAN'>('NOC_OPERATOR');
  const [signupSection, setSignupSection] = useState('Madhapur Section, TSSPDCL');

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!loginEmail || !loginPassword) {
      setFormError('Please enter both TSSPDCL email and password.');
      return;
    }
    const success = await authClient.login(loginEmail, loginPassword);
    if (success) {
      onClose();
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      setFormError('Please fill in your Name, Official Email, and Password.');
      return;
    }
    const success = await authClient.signup({
      fullName: signupName,
      email: signupEmail,
      password: signupPassword,
      phone: signupPhone,
      employeeId: signupEmpId || undefined,
      role: signupRole,
      sectionOffice: signupSection,
    });
    if (success) {
      onClose();
    }
  };

  const setDemoLogin = (role: 'NOC_OPERATOR' | 'SECTION_ENGINEER' | 'FIELD_LINEMAN') => {
    setFormError(null);
    if (role === 'NOC_OPERATOR') {
      setLoginEmail('ramesh.varma@tsspdcl.gov.in');
      setLoginPassword('Password123!');
    } else if (role === 'SECTION_ENGINEER') {
      setLoginEmail('srinivas.reddy@tsspdcl.gov.in');
      setLoginPassword('Password123!');
    } else if (role === 'FIELD_LINEMAN') {
      setLoginEmail('ramulu.k@tsspdcl.gov.in');
      setLoginPassword('Password123!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-cyan-950/40'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Top Header Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className={`p-6 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                TSSPDCL Operations Portal
                <span className="text-[10px] bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Secure Access
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Cybercity Circle Outage &amp; Lineman Dispatch Engine
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div
            className={`flex p-1 rounded-xl border mt-4 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => {
                setTab('LOGIN');
                setFormError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'LOGIN'
                  ? 'bg-cyan-600 text-white shadow-md font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('SIGNUP');
                setFormError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'SIGNUP'
                  ? 'bg-cyan-600 text-white shadow-md font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register Officer / Lineman
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {(formError || authState.error) && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{formError || authState.error}</span>
          </div>
        )}

        {/* Tab 1: Sign In */}
        {tab === 'LOGIN' && (
          <div className="p-6 pt-4 space-y-4">
            {/* Quick Demo Fill Pills */}
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                One-Click Demo Personas:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoLogin('NOC_OPERATOR')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/50'
                      : 'bg-slate-50 border-slate-200 hover:border-cyan-500 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 text-xs font-bold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>NOC Dispatcher</span>
                  </div>
                  <div className={`text-xs font-semibold mt-1 truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Ramesh Varma
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">OP-842</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoLogin('SECTION_ENGINEER')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/50'
                      : 'bg-slate-50 border-slate-200 hover:border-cyan-500 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Section AE</span>
                  </div>
                  <div className={`text-xs font-semibold mt-1 truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Srinivas Reddy
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">AE-104</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoLogin('FIELD_LINEMAN')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/50'
                      : 'bg-slate-50 border-slate-200 hover:border-cyan-500 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Field Lineman</span>
                  </div>
                  <div className={`text-xs font-semibold mt-1 truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    K. Ramulu
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">LM-302</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="operator@tsspdcl.gov.in"
                    className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border transition-all ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border transition-all ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600'
                    }`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authState.isLoading}
                className="w-full mt-2 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs md:text-sm rounded-xl shadow-lg shadow-cyan-600/30 cursor-pointer transition-all disabled:opacity-50"
              >
                {authState.isLoading ? 'Authenticating with Supabase...' : 'Sign In to Operations Console'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Sign Up */}
        {tab === 'SIGNUP' && (
          <form onSubmit={handleSignupSubmit} className="p-6 pt-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Full Name &amp; Designation
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. M. Venkat Rao (Sub-Engineer)"
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600'
                  }`}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Official Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="venkat.rao@tsspdcl.gov.in"
                    className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border transition-all ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Employee ID
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={signupEmpId}
                    onChange={(e) => setSignupEmpId(e.target.value)}
                    placeholder="SE-204"
                    className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border transition-all ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Operational Role
                </label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as any)}
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border cursor-pointer ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
                  }`}
                >
                  <option value="NOC_OPERATOR">NOC Dispatcher / Operator</option>
                  <option value="SECTION_ENGINEER">Assistant / Sub-Engineer</option>
                  <option value="FIELD_LINEMAN">Field Lineman Technician</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Mobile Contact
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 94906 12345"
                    className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border transition-all ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Section / Substation Office
              </label>
              <input
                type="text"
                value={signupSection}
                onChange={(e) => setSignupSection(e.target.value)}
                placeholder="Madhapur Section, TSSPDCL"
                className={`w-full rounded-xl px-3 py-2 text-xs outline-none border transition-all ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Account Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600'
                  }`}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authState.isLoading}
              className="w-full mt-3 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs md:text-sm rounded-xl shadow-lg shadow-cyan-600/30 cursor-pointer transition-all disabled:opacity-50"
            >
              {authState.isLoading ? 'Registering Account on Supabase...' : 'Create TSSPDCL Officer Account'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div
          className={`p-3 border-t text-center text-xs ${
            isDark ? 'bg-slate-950/80 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}
        >
          Secured with Bcrypt Encryption &amp; JWT Bearer Tokens • TSSPDCL Cybercity Division
        </div>
      </div>
    </div>
  );
};
