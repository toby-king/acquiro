import { Navigate, useLocation } from 'react-router-dom';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { Dashboard } from './Dashboard';

/**
 * Protects the dashboard route: only allows access when the user has a persisted
 * session (userId). Redirects to home otherwise so they are not "logged in".
 */
export function DashboardGuard() {
  const userId = useAdvisorStore((s) => s.userId);
  const location = useLocation();

  if (!userId) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Dashboard />;
}
