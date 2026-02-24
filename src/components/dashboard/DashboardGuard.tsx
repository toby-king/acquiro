import { Navigate, useLocation } from 'react-router-dom';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { Dashboard } from './Dashboard';

/**
 * Protects routes that require a logged-in user (userId). Redirects to home otherwise.
 * Renders children when provided (e.g. Settings page), otherwise renders Dashboard.
 */
export function DashboardGuard({ children }: { children?: React.ReactNode }) {
  const userId = useAdvisorStore((s) => s.userId);
  const location = useLocation();

  if (!userId) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children ?? <Dashboard />}</>;
}
