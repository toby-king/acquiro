import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

type MatchStatus = 'new' | 'pending' | null;

interface MatchCardProps {
  companyName: string;
  description: string;
  status: MatchStatus;
  thumbnail: string | null;
  onClick: () => void;
}

export function MatchCard({
  companyName,
  description,
  status,
  thumbnail,
  onClick,
}: MatchCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl hover:bg-[var(--bg-secondary)] hover:border-accent/50 transition-all group"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-xl flex-shrink-0 overflow-hidden">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={companyName} 
            className="w-full h-full object-cover max-w-full"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <span className="text-gray-600 text-xs font-semibold">
              {companyName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-[var(--text-primary)] truncate">{companyName}</h3>
          {status && <StatusBadge status={status} />}
        </div>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{description}</p>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-accent transition-colors flex-shrink-0" />
    </motion.button>
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
