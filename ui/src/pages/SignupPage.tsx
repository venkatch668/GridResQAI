import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../services/authClient';
import { realtimeClient } from '../services/realtimeClient';
import { ThemeMode } from '../types';
import {
  User,
  Mail,
  Lock,
  Briefcase,
  Building,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface SignupPageProps {
  theme?: ThemeMode;
  onNavigateLogin?: () => void;
  onNavigateMap?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  theme = 'light',
  onNavigateLogin,
  onNavigateMap,
}) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'NOC_OPERATOR' | 'SECTION_ENGINEER' | 'FIELD_LINEMAN'>('NOC_OPERATOR');
  const [sectionOffice, setSectionOffice] = useState('Cybercity Division, TSSPDCL');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const goToLogin = () => {
    realtimeClient.setActivePage('login');
    if (onNavigateLogin) onNavigateLogin();
    navigate('/login');
  };

  const goToMap = () => {
    realtimeClient.setActivePage('map');
    if (onNavigateMap) onNavigateMap();
    navigate('/map');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setFeedback({ type: 'error', text: 'PLEASE FILL ALL REQUIRED FIELDS' });
      return;
    }

    setIsLoading(true);
    const success = await authClient.signup({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      role,
      sectionOffice: sectionOffice.trim(),
    });
    setIsLoading(false);

    if (success) {
      goToMap();
    } else {
      setFeedback({
        type: 'error',
        text: 'REGISTRATION FAILED. EMAIL MAY ALREADY BE REGISTERED',
      });
    }
  };

  return (
    <div
      className={`relative min-h-screen w-full flex items-center justify-center p-6 select-none font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Header */}
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
              Officer Registration
            </span>
          </div>
        </div>

        <button
          onClick={goToLogin}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer shadow-sm ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </button>
      </div>

      {/* Centered Clean Card */}
      <div
        className={`relative z-10 w-[520px] max-w-[94vw] rounded-3xl border shadow-xl p-8 sm:p-10 flex flex-col items-center justify-center transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
          <p className={`text-sm mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Register a verified TSSPDCL department officer profile
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

        <form onSubmit={handleSignup} className="w-full flex flex-col space-y-4">
          {/* FULL NAME */}
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
              placeholder="Officer Full Name (e.g. S. Venkat Rao)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`bg-transparent w-full text-sm font-medium focus:outline-none ${
                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* EMAIL */}
          <div
            className={`relative flex items-center border rounded-xl px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-cyan-500/40 ${
              isDark
                ? 'bg-slate-950/70 border-slate-700 focus-within:border-cyan-500'
                : 'bg-slate-50 border-slate-300 focus-within:border-cyan-600'
            }`}
          >
            <Mail className={`w-5 h-5 shrink-0 mr-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="email"
              required
              placeholder="Official Email (@tsspdcl.gov.in)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`bg-transparent w-full text-sm font-medium focus:outline-none ${
                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* PASSWORD */}
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
              placeholder="Create Secure Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`bg-transparent w-full text-sm font-medium focus:outline-none ${
                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* ROLE SELECTOR */}
          <div
            className={`relative flex items-center border rounded-xl px-4 py-3 transition-all ${
              isDark ? 'bg-slate-950/70 border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <Briefcase className={`w-5 h-5 shrink-0 mr-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className={`bg-transparent w-full text-sm font-medium focus:outline-none cursor-pointer ${
                isDark ? 'text-white bg-slate-900' : 'text-slate-900 bg-white'
              }`}
            >
              <option value="NOC_OPERATOR">NOC Dispatch Operator</option>
              <option value="SECTION_ENGINEER">Assistant Engineer (AE / Operations)</option>
              <option value="FIELD_LINEMAN">Emergency Line Technician / Lineman</option>
            </select>
          </div>

          {/* SECTION OFFICE */}
          <div
            className={`relative flex items-center border rounded-xl px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-cyan-500/40 ${
              isDark
                ? 'bg-slate-950/70 border-slate-700 focus-within:border-cyan-500'
                : 'bg-slate-50 border-slate-300 focus-within:border-cyan-600'
            }`}
          >
            <Building className={`w-5 h-5 shrink-0 mr-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              required
              placeholder="Section Office / Circle"
              value={sectionOffice}
              onChange={(e) => setSectionOffice(e.target.value)}
              className={`bg-transparent w-full text-sm font-medium focus:outline-none ${
                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wider uppercase shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2 ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>REGISTERING ACCOUNT...</span>
              </>
            ) : (
              <span>REGISTER ACCOUNT</span>
            )}
          </button>

          <div className="w-full text-center text-xs pt-2">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Already have an account? </span>
            <button
              type="button"
              onClick={goToLogin}
              className={`font-semibold hover:underline cursor-pointer ${
                isDark ? 'text-cyan-400' : 'text-cyan-600'
              }`}
            >
              Sign In here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
