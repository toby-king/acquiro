import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, CheckCircle2, Loader2, X, ExternalLink } from 'lucide-react';
import {
  getUserNotifications,
  markNotificationActioned,
  uploadSignedNDA,
  type UserNotification,
} from '../../services/notificationService';
import { getLangcliffeQueue } from '../../services/langcliffeService';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

function NdaBanner({
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
    <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <FileText size={16} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{notification.title_text}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{notification.body_text}</p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {ndaFileUrl && (
                <a
                  href={ndaFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  <ExternalLink size={12} />
                  Download NDA
                </a>
              )}

              {uploadState === 'done' ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-green-400 font-medium">
                  <CheckCircle2 size={14} />
                  Uploaded — thank you!
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadState === 'uploading'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-black hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploadState === 'uploading' ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Upload size={12} />
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
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function NdaNotificationBanner({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [ndaUrls, setNdaUrls] = useState<Record<string, string | null>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    getUserNotifications(userId)
      .then(async (notifs) => {
        setNotifications(notifs);

        // Fetch NDA file URLs from the outreach records
        const ndaMap: Record<string, string | null> = {};
        const outreachIds = [...new Set(notifs.map((n) => n.outreach_langcliffeoutreach).filter(Boolean))];
        if (outreachIds.length > 0) {
          try {
            const queue = await getLangcliffeQueue();
            for (const id of outreachIds) {
              const outreach = queue.find((o) => o._id === id);
              ndaMap[id] = outreach?.nda_file_text ?? null;
            }
          } catch {
            for (const id of outreachIds) ndaMap[id] = null;
          }
        }
        setNdaUrls(ndaMap);
      })
      .catch(() => {});
  }, [userId]);

  const visible = notifications.filter((n) => !dismissed.has(n._id));
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((n) => (
        <NdaBanner
          key={n._id}
          notification={n}
          ndaFileUrl={ndaUrls[n.outreach_langcliffeoutreach] ?? null}
          onDismiss={() => setDismissed((prev) => new Set([...prev, n._id]))}
        />
      ))}
    </>
  );
}
