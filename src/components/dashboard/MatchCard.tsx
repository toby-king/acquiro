import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';

type MatchStatus = 'new' | 'pending' | null;

const DISMISS_REASONS = [
  { key: 'wrong_sector',   label: 'Wrong sector' },
  { key: 'wrong_price',    label: 'Wrong price' },
  { key: 'wrong_size',     label: 'Wrong size' },
  { key: 'wrong_location', label: 'Wrong location' },
] as const;

interface MatchCardProps {
  companyName: string;
  description: string;
  status: MatchStatus;
  thumbnail: string | null;
  matchId?: string | null;
  matchReason?: string | null;
  onClick: () => void;
  /** Called when the X button is first clicked — parent should show feedback row */
  onDismissRequest?: () => void;
  /** Called when a reason button is clicked, or undefined to dismiss without reason */
  onDismissConfirm?: (reason?: string) => void;
  /** When true, the feedback reason row is shown instead of the X button */
  showFeedback?: boolean;
}

export function MatchCard({
  companyName,
  description,
  status,
  thumbnail,
  matchId,
  matchReason,
  onClick,
  onDismissRequest,
  onDismissConfirm,
  showFeedback = false,
}: MatchCardProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = thumbnail && !imageError;
  const canDismiss = matchId && (onDismissRequest || onDismissConfirm);

  return (
    <div
      data-match-id={matchId ?? undefined}
      className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-colors hover:border-accent/50"
    >
      {/* Feedback row — top */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-[var(--border)]"
          >
            <div className="px-4 py-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--text-tertiary)] mr-1">Why not a fit?</span>
              {DISMISS_REASONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onDismissConfirm?.(key)}
                  className="px-3 py-1.5 text-xs rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-accent hover:text-accent transition-colors"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onDismissConfirm?.(undefined)}
                className="ml-auto px-3 py-1.5 text-xs rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main row */}
      <div className="relative flex items-center gap-4 p-4 hover:bg-[var(--bg-secondary)] transition-colors group">
        <button
          type="button"
          onClick={onClick}
          className="flex-1 flex items-center gap-4 text-left min-w-0"
        >
          {/* Thumbnail or fallback initial */}
          <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-xl flex-shrink-0 overflow-hidden">
            {showImage ? (
              <img
                src={thumbnail!}
                alt={companyName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <span className="text-gray-400 text-lg font-semibold">
                  {companyName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-[var(--text-primary)] truncate">{companyName}</h3>
              {status && <StatusBadge status={status} />}
            </div>
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{description}</p>
            {matchReason && (
              <p className="text-xs text-accent/80 mt-1 line-clamp-1">{matchReason}</p>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-accent transition-colors flex-shrink-0" />
        </button>

        {/* Dismiss / close button */}
        {canDismiss && !showFeedback && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismissRequest?.();
            }}
            aria-label="Dismiss match"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
}

function StatusBadge({ status }: { status: 'new' | 'pending' }) {
  const styles = {
    new: 'bg-accent text-black',
    pending: 'bg-orange-500 text-white',
  };

  const labels = {
    new: 'New',
    pending: 'Pending',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
