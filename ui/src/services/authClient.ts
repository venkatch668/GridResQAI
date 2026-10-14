export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'NOC_OPERATOR' | 'SECTION_ENGINEER' | 'FIELD_LINEMAN' | 'ADMIN';
  sectionOffice: string;
  employeeId?: string;
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type AuthListener = (state: AuthState) => void;

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';
const TOKEN_KEY = 'gridresq_auth_token';
const USER_KEY = 'gridresq_auth_user';
const LOGGED_OUT_KEY = 'gridresq_logged_out';

class AuthClient {
  private listeners: AuthListener[] = [];
  private state: AuthState;

  constructor() {
    const isExplicitlyLoggedOut = localStorage.getItem(LOGGED_OUT_KEY) === 'true';
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUserJson = localStorage.getItem(USER_KEY);
    let savedUser: AuthUser | null = null;

    if (!isExplicitlyLoggedOut && savedUserJson) {
      try {
        savedUser = JSON.parse(savedUserJson);
      } catch {
        savedUser = null;
      }
    }

    this.state = {
      user: savedUser,
      token: savedToken,
      isAuthenticated: !!savedUser,
      isLoading: false,
      error: null,
    };
  }

  public getState(): AuthState {
    return this.state;
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public async login(email: string, password: string): Promise<boolean> {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Invalid email or password');
      }

      const data = await res.json();
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.full_name,
        phone: data.user.phone,
        role: data.user.role,
        sectionOffice: data.user.section_office,
        employeeId: data.user.employee_id,
        createdAt: data.user.created_at,
      };

      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.removeItem(LOGGED_OUT_KEY);

      this.state.token = data.access_token;
      this.state.user = user;
      this.state.isAuthenticated = true;
      this.state.isLoading = false;
      this.state.error = null;
      this.notify();
      return true;
    } catch (err: any) {
      this.state.isLoading = false;
      this.state.error = err.message || 'Login failed';
      this.notify();
      return false;
    }
  }

  public async signup(formData: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: string;
    sectionOffice?: string;
    employeeId?: string;
  }): Promise<boolean> {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          full_name: formData.fullName.trim(),
          phone: formData.phone?.trim() || null,
          role: formData.role || 'NOC_OPERATOR',
          section_office: formData.sectionOffice?.trim() || 'Cybercity Division, TSSPDCL',
          employee_id: formData.employeeId?.trim() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Signup failed');
      }

      const data = await res.json();
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.full_name,
        phone: data.user.phone,
        role: data.user.role,
        sectionOffice: data.user.section_office,
        employeeId: data.user.employee_id,
        createdAt: data.user.created_at,
      };

      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.removeItem(LOGGED_OUT_KEY);

      this.state.token = data.access_token;
      this.state.user = user;
      this.state.isAuthenticated = true;
      this.state.isLoading = false;
      this.state.error = null;
      this.notify();
      return true;
    } catch (err: any) {
      this.state.isLoading = false;
      this.state.error = err.message || 'Signup failed';
      this.notify();
      return false;
    }
  }

  public logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(LOGGED_OUT_KEY, 'true');
    this.state.token = null;
    this.state.user = null;
    this.state.isAuthenticated = false;
    this.state.error = null;
    this.notify();
  }

  // Quick switch between seeded demo personas
  public switchDemoUser(role: 'NOC_OPERATOR' | 'SECTION_ENGINEER' | 'FIELD_LINEMAN') {
    let demo: AuthUser;
    if (role === 'SECTION_ENGINEER') {
      demo = {
        id: 'usr-ae-104',
        email: 'srinivas.reddy@tsspdcl.gov.in',
        fullName: 'K. Srinivas Reddy (AE / Op)',
        phone: '+91 94906 18201',
        employeeId: 'AE-104',
        role: 'SECTION_ENGINEER',
        sectionOffice: 'Madhapur Section, TSSPDCL',
        createdAt: new Date().toISOString(),
      };
    } else if (role === 'FIELD_LINEMAN') {
      demo = {
        id: 'usr-lm-302',
        email: 'ramulu.k@tsspdcl.gov.in',
        fullName: 'K. Ramulu (Senior Lineman)',
        phone: '+91 94408 12301',
        employeeId: 'LM-302',
        role: 'FIELD_LINEMAN',
        sectionOffice: 'Madhapur Emergency Squad',
        createdAt: new Date().toISOString(),
      };
    } else {
      demo = {
        id: 'usr-op-842',
        email: 'ramesh.varma@tsspdcl.gov.in',
        fullName: 'Operator Ramesh Varma',
        phone: '+91 94906 18001',
        employeeId: 'OP-842',
        role: 'NOC_OPERATOR',
        sectionOffice: 'Cybercity Division Operations NOC',
        createdAt: new Date().toISOString(),
      };
    }

    localStorage.setItem(USER_KEY, JSON.stringify(demo));
    localStorage.removeItem(LOGGED_OUT_KEY);
    this.state.user = demo;
    this.state.isAuthenticated = true;
    this.notify();
  }
}

export const authClient = new AuthClient();

