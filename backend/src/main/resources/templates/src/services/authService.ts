import axios from 'axios';
import { CustomerType } from '../types/schema';

const API_BASE = '/api/v1';

export interface AuthSessionUser {
  userId: number;
  email: string;
  fullName: string;
  role: 'USER' | 'CASHIER' | 'STOCK_CONTROLLER' | 'ADMIN';
  customerType?: CustomerType;
  token: string;
  avatarUrl?: string;
  phone?: string;
  companyName?: string;
  addresses?: string[];
}

export const authService = {
  /**
   * Authenticate with email & password via Spring Boot stateless JWT endpoint
   */
  async login(email: string, password: string): Promise<AuthSessionUser> {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: email.trim(),
        password
      });
      const data = res.data;
      const sessionUser: AuthSessionUser = {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        role: (data.role || 'USER') as any,
        customerType: data.customerType || 'RETAIL',
        token: data.token,
        avatarUrl: data.avatarUrl,
        phone: data.phone,
        companyName: data.companyName,
        addresses: typeof data.addresses === 'string' ? (() => { try { return JSON.parse(data.addresses); } catch { return []; } })() : data.addresses
      };

      // Synchronize role-specific JWT into appropriate storage
      if (sessionUser.role === 'ADMIN') {
        localStorage.setItem('admin_jwt', sessionUser.token);
      } else if (sessionUser.role === 'STOCK_CONTROLLER') {
        localStorage.setItem('inventory_jwt', sessionUser.token);
      } else if (sessionUser.role === 'CASHIER') {
        localStorage.setItem('cashier_jwt', sessionUser.token);
      } else {
        localStorage.setItem('customer_jwt', sessionUser.token);
      }

      // Synchronize avatar into localStorage caches for immediate UI rendering
      if (data.avatarUrl) {
        localStorage.setItem(`aura_avatar_user_${data.userId}`, data.avatarUrl);
        localStorage.setItem(`aura_avatar_${data.userId}`, data.avatarUrl);
        localStorage.setItem(`aura_avatar_${data.email.toLowerCase()}`, data.avatarUrl);
        localStorage.setItem('aura_avatar_current', data.avatarUrl);
      }

      localStorage.setItem('auth_current_user', JSON.stringify(sessionUser));
      return sessionUser;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please verify credentials.';
      throw new Error(msg);
    }
  },

  /**
   * Register a new customer
   */
  async register(email: string, password: string, fullName: string, phone?: string): Promise<any> {
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone?.trim() || ''
      });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      throw new Error(msg);
    }
  },

  /**
   * Authenticate cashier via Staff Profile + 4-digit PIN
   */
  async loginCashierPin(cashierId: number, pin: string): Promise<AuthSessionUser> {
    try {
      const res = await axios.post(`${API_BASE}/pos/pin-login`, {
        cashierId,
        pin: pin.trim()
      });
      const data = res.data;
      const sessionUser: AuthSessionUser = {
        userId: data.userId || cashierId,
        email: data.email || `cashier${cashierId}@retailstore.com`,
        fullName: data.fullName || 'Cashier Staff',
        role: 'CASHIER',
        customerType: 'RETAIL',
        token: data.token || ''
      };

      if (sessionUser.token) {
        localStorage.setItem('cashier_jwt', sessionUser.token);
      }
      localStorage.setItem('active_cashier_id', String(cashierId));
      localStorage.setItem('active_cashier_name', sessionUser.fullName);
      localStorage.setItem('active_cashier_role', 'CASHIER');
      localStorage.setItem('auth_current_user', JSON.stringify(sessionUser));
      return sessionUser;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Incorrect PIN or cashier ID.';
      throw new Error(msg);
    }
  },

  /**
   * Verify whether a specific role token is valid and active
   */
  hasRoleToken(role: 'ADMIN' | 'CASHIER' | 'STOCK_CONTROLLER' | 'USER'): boolean {
    switch (role) {
      case 'ADMIN':
        return !!localStorage.getItem('admin_jwt');
      case 'CASHIER':
        return !!localStorage.getItem('active_cashier_id') || !!localStorage.getItem('cashier_jwt');
      case 'STOCK_CONTROLLER':
        return !!localStorage.getItem('inventory_jwt') || !!localStorage.getItem('admin_jwt');
      case 'USER':
        return !!localStorage.getItem('customer_jwt');
      default:
        return false;
    }
  },

  /**
   * Get active session user if stored
   */
  getCurrentUser(): AuthSessionUser | null {
    try {
      const str = localStorage.getItem('auth_current_user');
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  },

  /**
   * Logout from a specific role or all roles
   */
  logoutRole(role: 'ADMIN' | 'CASHIER' | 'STOCK_CONTROLLER' | 'USER'): void {
    if (role === 'ADMIN') {
      localStorage.removeItem('admin_jwt');
    } else if (role === 'CASHIER') {
      localStorage.removeItem('cashier_jwt');
      localStorage.removeItem('active_cashier_id');
      localStorage.removeItem('active_cashier_name');
      localStorage.removeItem('active_cashier_email');
      localStorage.removeItem('active_cashier_role');
      localStorage.removeItem('active_cashier_avatar_color');
    } else if (role === 'STOCK_CONTROLLER') {
      localStorage.removeItem('inventory_jwt');
    } else if (role === 'USER') {
      localStorage.removeItem('customer_jwt');
    }

    const current = this.getCurrentUser();
    if (current && current.role === role) {
      localStorage.removeItem('auth_current_user');
    }
  },

  logoutAll(): void {
    localStorage.removeItem('admin_jwt');
    localStorage.removeItem('cashier_jwt');
    localStorage.removeItem('inventory_jwt');
    localStorage.removeItem('customer_jwt');
    localStorage.removeItem('active_cashier_id');
    localStorage.removeItem('active_cashier_name');
    localStorage.removeItem('active_cashier_email');
    localStorage.removeItem('active_cashier_role');
    localStorage.removeItem('active_cashier_avatar_color');
    localStorage.removeItem('auth_current_user');
  }
};
