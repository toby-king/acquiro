import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { getUser } from '../../services/userService';
import { Loader2 } from 'lucide-react';

/**
 * Protects /admin: only allows access when the user is logged in and has is_admin from Bubble.
 * Redirects to / if not logged in, to /dashboard if not admin.
 * Caches is_admin in the store after first successful check.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const userId = useAdvisorStore((s) => s.userId);
  const isAdmin = useAdvisorStore((s) => s.isAdmin);
  const setAdmin = useAdvisorStore((s) => s.setAdmin);
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!userId) {
      setChecking(false);
      return;
    }
    if (isAdmin === true) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    getUser(userId)
      .then((result) => {
        if (cancelled) return;
        if (result.isAdmin) {
          setAdmin(true);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, isAdmin, setAdmin]);

  if (!userId) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  if (checking) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">Checking admin access...</p>
      </div>
    );
  }
  if (isAdmin !== true) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
