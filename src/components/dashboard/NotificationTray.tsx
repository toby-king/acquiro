import { useState, useEffect, useRef } from 'react';
import { Bell, FileText, Upload, CheckCircle2, Loader2, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getUserNotifications,
  markNotificationActioned,
  uploadSignedNDA,
  type UserNotification,
} from '../../services/notificationService';
import { getLangcliffeQueue } from '../../services/langcliffeService';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

function NotificationItem({
  notification,
  ndaFileUrl,
  onDismiss,
}: {
  notification: UserNotification;
  ndaFileUrl: string | null;
  onDismiss: () => void;
}) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState('uploading');
    setErrorMsg('');
    try {
      await uploadSignedNDA(notification.outreach_langcliffeoutreach, file);
      await markNotificationActioned(notification._id);
      setUploadState('done');
      setTimeout(onDismiss, 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setUploadState('error');
    }
  };

  return (
    <div className="px-4 py-3 border-b border-[var(--border)] last:border-0">
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
          <FileText size={13} className="text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
            {notification.title_text}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
            {notification.body_text}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {ndaFileUrl && (
              <a
                href={ndaFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <ExternalLink size={10} />
                Download NDA
              </a>
            )}

            {uploadState === 'done' ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium">
                <CheckCircle2 size={12} />
                Uploaded!
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadState === 'uploading'}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-black hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadState === 'uploading' ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Upload size={10} />
                  )}
                  {uploadState === 'uploading' ? 'Uploading…' : 'Upload signed NDA'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}

            {uploadState === 'error' && (
              <span className="text-xs text-red-400">{errorMsg}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 p-0.5 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

export function NotificationTray({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [ndaUrls, setNdaUrls] = useState<Record<string, string | null>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const trayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      if (document.hidden) return;
      try {
        const notifs = await getUserNotifications(userId);
        setNotifications((prev) => {
          const prevIds = prev.map((n) => n._id).join(',');
          const nextIds = notifs.map((n) => n._id).join(',');
          return prevIds === nextIds ? prev : notifs;
        });

        const outreachIds = [...new Set(notifs.map((n) => n.outreach_langcliffeoutreach).filter(Boolean))];
        if (outreachIds.length > 0) {
          try {
            const queue = await getLangcliffeQueue();
            const ndaMap: Record<string, string | null> = {};
            for (const id of outreachIds) {
              const outreach = queue.find((o) => o._id === id);
              ndaMap[id] = outreach?.nda_file_file ?? null;
            }
            setNdaUrls(ndaMap);
          } catch {
            // keep existing urls on error
          }
        }
      } catch {
        // keep existing notifications on error
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    const handleVisibility = () => { if (!document.hidden) fetchNotifications(); };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const visible = notifications.filter((n) => !dismissed.has(n._id));
  const hasUnread = visible.length > 0;

  return (
    <div className="relative" ref={trayRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="relative min-h-[44px] min-w-[44px] rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {hasUnread && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-lg z-50 overflow-hidden"
          >
            {/* Tray header */}
            <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Notifications
              </span>
              {hasUnread && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                  {visible.length}
                </span>
              )}
            </div>

            {/* Items */}
            <div className="max-h-80 overflow-y-auto">
              {visible.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] text-center py-6">
                  No notifications
                </p>
              ) : (
                visible.map((n) => (
                  <NotificationItem
                    key={n._id}
                    notification={n}
                    ndaFileUrl={ndaUrls[n.outreach_langcliffeoutreach] ?? null}
                    onDismiss={() => setDismissed((prev) => new Set([...prev, n._id]))}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
