import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminLoginGuard } from './AdminLoginGuard';
import { CashierLoginGuard } from './CashierLoginGuard';
import { StockLoginGuard } from './StockLoginGuard';
import { CustomerLoginPage } from '../../features/customer/CustomerLoginPage';
import { useCustomerCartStore } from '../../store/customerCartStore';

interface ProtectedRouteProps {
  allowedRoles: ('ADMIN' | 'CASHIER' | 'STOCK_CONTROLLER' | 'USER')[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { hasAccess, refreshAuthState } = useAuth();
  const { isAuthenticated: isCustomerAuthed } = useCustomerCartStore();

  const isAllowed = allowedRoles.some(role => {
    if (role === 'USER') {
      return hasAccess('USER') || isCustomerAuthed;
    }
    return hasAccess(role);
  });

  if (isAllowed) {
    return <>{children}</>;
  }

  // Render appropriate role login guard directly on the protected URL
  if (allowedRoles.includes('ADMIN')) {
    return <AdminLoginGuard onSuccess={refreshAuthState} />;
  }

  if (allowedRoles.includes('CASHIER')) {
    return <CashierLoginGuard onSuccess={refreshAuthState} />;
  }

  if (allowedRoles.includes('STOCK_CONTROLLER')) {
    return <StockLoginGuard onSuccess={refreshAuthState} />;
  }

  // Customer protection (for /orders, /checkout)
  return <CustomerLoginPage />;
};
