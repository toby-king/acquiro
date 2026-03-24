import { useState, useEffect, useRef } from 'react';
import { Bell, FileText, Upload, CheckCircle2, Loader2, ExternalLink, X, Copy, Check, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getUserNotifications,
  markNotificationActioned,
  uploadSignedNDA,
  getNdaFileUrl,
  type UserNotification,
} from '../../services/notificationService';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

/** Extract the IM URL and password embedded in the notification body text */
function parseIMBody(body: string): { url: string | null; password: string | null } {
  const urlMatch = body.match(/Link:\s*(https?:\/\/\S+)/);
  const pwMatch  = body.match(/Password:\s*(\S+)/);
  return {
    url:      urlMatch ? urlMatch[1] : null,
    password: pwMatch  ? pwMatch[1]  : null,
  };
}

function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
    >
      {copied ? <Check size={9} className="text-green-400" /> : <Copy size={9} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

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
  const isIM = notification.type === 'im_received';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState('uploading');
    setErrorMsg('');
    try {
      await uploadSignedNDA(notification.langcliffe_outreach, file);
      await markNotificationActioned(notification.id);
      setUploadState('done');
      setTimeout(onDismiss, 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setUploadState('error');
    }
  };

  const handleDismissIM = async () => {
    try { await markNotificationActioned(notification.id); } catch { /* non-fatal */ }
    onDismiss();
  };

  const { url: imUrl, password: imPassword } = isIM ? parseIMBody(notification.body ?? '') : { url: null, password: null };

  return (
    <div className="px-4 py-3 border-b border-[var(--border)] last:border-0">
      <div className="flex items-start gap-2.5">
        <div className={`flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center ${isIM ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
          {isIM ? <BookOpen size={13} className="text-green-400" /> : <FileText size={13} className="text-blue-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
            {notification.title}
          </p>

          {isIM ? (
            <div className="mt-1.5 space-y-1.5">
              {imUrl && (
                <div className="flex items-center gap-1.5">
                  <a
                    href={imUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-black hover:bg-accent/90 transition-colors"
                  >
                    <ExternalLink size={10} />
                    Open IM
                  </a>
                </div>
              )}
              {imPassword && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[var(--text-tertiary)]">Password:</span>
                  <code className="text-[10px] font-mono text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                    {imPassword}
                  </code>
                  <CopyText text={imPassword} />
                </div>
              )}
              <button
                type="button"
                onClick={handleDismissIM}
                className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mt-0.5"
              >
                Mark as reviewed
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                {notification.body}
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
                      {uploadState === 'uploading' ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                      {uploadState === 'uploading' ? 'Uploading…' : 'Upload signed NDA'}
                    </button>
                    <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />
                  </>
                )}
                {uploadState === 'error' && <span className="text-xs text-red-400">{errorMsg}</span>}
              </div>
            </>
          )}
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
          const prevIds = prev.map((n) => n.id).join(',');
          const nextIds = notifs.map((n) => n.id).join(',');
          return prevIds === nextIds ? prev : notifs;
        });

        const outreachIds = [...new Set(notifs.map((n) => n.langcliffe_outreach).filter(Boolean))];
        if (outreachIds.length > 0) {
          const ndaMap: Record<string, string | null> = {};
          await Promise.all(outreachIds.map(async (id) => {
            ndaMap[id] = await getNdaFileUrl(id);
          }));
          setNdaUrls(ndaMap);
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

  const visible = notifications.filter((n) => !dismissed.has(n.id));
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
                    key={n.id}
                    notification={n}
                    ndaFileUrl={ndaUrls[n.langcliffe_outreach] ?? null}
                    onDismiss={() => setDismissed((prev) => new Set([...prev, n.id]))}
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
