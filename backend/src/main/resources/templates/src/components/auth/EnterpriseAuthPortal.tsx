import React from 'react';
import { useLocation } from 'react-router-dom';
import { UnifiedLoginForm } from './UnifiedLoginForm';

interface EnterpriseAuthPortalProps {
  defaultRole?: 'USER' | 'CASHIER' | 'STOCK_CONTROLLER' | 'ADMIN';
}

export const EnterpriseAuthPortal: React.FC<EnterpriseAuthPortalProps> = () => {
  const location = useLocation();
  const isRegister = location.pathname.toLowerCase() === '/signup' || location.pathname.toLowerCase() === '/register';
  return <UnifiedLoginForm defaultMode={isRegister ? 'register' : 'login'} />;
};

export default EnterpriseAuthPortal;
