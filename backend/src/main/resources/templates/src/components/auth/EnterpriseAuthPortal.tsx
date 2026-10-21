import React from 'react';
import { UnifiedLoginForm } from './UnifiedLoginForm';

interface EnterpriseAuthPortalProps {
  defaultRole?: 'USER' | 'CASHIER' | 'STOCK_CONTROLLER' | 'ADMIN';
}

export const EnterpriseAuthPortal: React.FC<EnterpriseAuthPortalProps> = () => {
  return <UnifiedLoginForm />;
};

export default EnterpriseAuthPortal;
