import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UnifiedLoginForm } from './UnifiedLoginForm';
import { useCustomerCartStore } from '../../store/customerCartStore';

interface ProtectedRouteProps {
  allowedRoles: ('ADMIN' | 'CASHIER' | 'STOCK_CONTROLLER' | 'USER')[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { hasAccess, refreshAuthState } = useAuth();
  const { isAuthenticated: isCustomerAuthed } = useCustomerCartStore();

  const isAllowed = allowedRoles.some((role) => {
    if (role === 'USER') {
      return hasAccess('USER') || isCustomerAuthed;
    }
    return hasAccess(role);
  });

  if (isAllowed) {
    return <>{children}</>;
  }

  // Render unified login form directly using the same clean UI across the system
  return <UnifiedLoginForm onSuccess={refreshAuthState} />;
};

export default ProtectedRoute;
