import { useState, useEffect } from 'react';
import { MatchCard } from './MatchCard';
import { fetchMatches, Match } from '../../services/matchesService';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { Loader2 } from 'lucide-react';

export function MatchesList() {
  // Use userId (Bubble user id set after payment) for matches API – do not use leadId
  const { userId } = useAdvisorStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      if (!userId) {
        setError('User ID not found. Please complete your subscription.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedMatches = await fetchMatches(userId);
        setMatches(fetchedMatches);
      } catch (err) {
        console.error('Error loading matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to load matches. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [userId]);

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 text-center">Your Matches.</h2>
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
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 text-center">Your Matches.</h2>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 max-w-md text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                if (userId) {
                  fetchMatches(userId)
                    .then(setMatches)
                    .catch((err) => {
                      setError(err instanceof Error ? err.message : 'Failed to load matches.');
                    })
                    .finally(() => setLoading(false));
                }
              }}
              className="px-4 py-2 bg-accent text-black rounded-full hover:bg-accent/90 transition-colors"
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
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 text-center">Your Matches.</h2>
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
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 text-center">Your Matches.</h2>

      <div className="space-y-3">
        {matches.map((match, index) => (
          <div
            key={match.id}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <MatchCard
              companyName={match.companyName}
              description={match.description}
              status={match.status}
              thumbnail={match.thumbnail}
              onClick={() => {
                // TODO: Navigate to match detail or open modal
                console.log('Clicked match:', match.id);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
