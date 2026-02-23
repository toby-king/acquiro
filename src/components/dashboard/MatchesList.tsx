import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MatchCard } from './MatchCard';
import { fetchMatches, dismissMatch, Match } from '../../services/matchesService';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { Loader2, RefreshCw } from 'lucide-react';

export function MatchesList() {
  // Use userId (Bubble user id set after payment) for matches API – do not use leadId
  const { userId, requestCallWithMatch } = useAdvisorStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async (isRefresh = false) => {
    if (!userId) {
      setError('User ID not found. Please complete your subscription.');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const fetchedMatches = await fetchMatches(userId);
      setMatches(fetchedMatches);
    } catch (err) {
      console.error('Error loading matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load matches. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleDismiss = useCallback(async (match: Match) => {
    if (!match.matchId) return;
    try {
      await dismissMatch(match.matchId);
      setMatches((prev) => prev.filter((m) => m.id !== match.id));
    } catch (err) {
      console.error('Failed to dismiss match:', err);
    }
  }, []);

  const matchesHeader = (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 mb-4 min-w-0">
      <div className="hidden sm:block" />
      <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)] text-center order-first sm:order-none">Your Matches.</h2>
        <div className="flex justify-end sm:order-last">
        <button
          type="button"
          onClick={() => loadMatches(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50 disabled:pointer-events-none text-sm"
          aria-label="Refresh matches"
          title="Refresh matches"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        {matchesHeader}
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-[var(--text-secondary)]">Loading matches...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {matchesHeader}
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 max-w-md text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => loadMatches()}
              className="min-h-[44px] px-4 py-2 bg-accent text-black rounded-full hover:bg-accent/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div>
        {matchesHeader}
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 max-w-md text-center">
            <p className="text-[var(--text-secondary)]">
              No matches found yet. Your advisor is searching for businesses that match your criteria.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {matchesHeader}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <MatchCard
                companyName={match.companyName}
                description={match.description}
                status={match.status}
                thumbnail={match.thumbnail}
                matchId={match.matchId}
                onClick={() => requestCallWithMatch(match)}
                onDismiss={() => handleDismiss(match)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
