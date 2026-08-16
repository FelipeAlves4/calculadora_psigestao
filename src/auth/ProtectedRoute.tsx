import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from './api';
import { useAuth } from './AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode; allowedRoles: UserRole[] }) => {
  const { user, loading, sessionNotice } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="route-loading" role="status" aria-live="polite">
        <span className="loading-spinner" />
        Validando acesso seguro…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname, sessionNotice }} />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/calculadora" replace />;
  return children;
};
