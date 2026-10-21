import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthSessionUser } from '../services/authService';

interface AuthContextType {
  currentUser: AuthSessionUser | null;
  isAdmin: boolean;
  isCashier: boolean;
  isStock: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<AuthSessionUser>;
  loginCashierPin: (cashierId: number, pin: string) => Promise<AuthSessionUser>;
  logoutRole: (role: 'ADMIN' | 'CASHIER' | 'STOCK_CONTROLLER' | 'USER') => void;
  logoutAll: () => void;
  hasAccess: (role: 'ADMIN' | 'CASHIER' | 'STOCK_CONTROLLER' | 'USER') => boolean;
  refreshAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(() => authService.getCurrentUser());

  const refreshAuthState = () => {
    setCurrentUser(authService.getCurrentUser());
  };

  useEffect(() => {
    const handleStorageChange = () => {
      refreshAuthState();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string) => {
    const user = await authService.login(email, password);
    setCurrentUser(user);
    return user;
  };

  const loginCashierPin = async (cashierId: number, pin: string) => {
    const user = await authService.loginCashierPin(cashierId, pin);
    setCurrentUser(user);
    return user;
  };

  const logoutRole = (role: 'ADMIN' | 'CASHIER' | 'STOCK_CONTROLLER' | 'USER') => {
    authService.logoutRole(role);
    refreshAuthState();
  };

  const logoutAll = () => {
    authService.logoutAll();
    setCurrentUser(null);
  };

  const hasAccess = (role: 'ADMIN' | 'CASHIER' | 'STOCK_CONTROLLER' | 'USER'): boolean => {
    if (role === 'ADMIN') {
      return authService.hasRoleToken('ADMIN') || currentUser?.role === 'ADMIN';
    }
    if (role === 'CASHIER') {
      return authService.hasRoleToken('CASHIER') || currentUser?.role === 'CASHIER' || currentUser?.role === 'ADMIN';
    }
    if (role === 'STOCK_CONTROLLER') {
      return authService.hasRoleToken('STOCK_CONTROLLER') || currentUser?.role === 'STOCK_CONTROLLER' || currentUser?.role === 'ADMIN';
    }
    if (role === 'USER') {
      return authService.hasRoleToken('USER') || currentUser?.role === 'USER' || currentUser?.role === 'ADMIN';
    }
    return false;
  };

  const isAdmin = hasAccess('ADMIN');
  const isCashier = hasAccess('CASHIER');
  const isStock = hasAccess('STOCK_CONTROLLER');
  const isCustomer = hasAccess('USER');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isCashier,
        isStock,
        isCustomer,
        login,
        loginCashierPin,
        logoutRole,
        logoutAll,
        hasAccess,
        refreshAuthState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
