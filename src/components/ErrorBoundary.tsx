import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional label shown in the error message to identify which section crashed */
  section?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.section ? ` — ${this.props.section}` : ''}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6">
          <AlertTriangle className="w-10 h-10 text-[var(--text-secondary)] mb-4" />
          <h2 className="text-[var(--text-primary)] font-semibold text-base mb-1">
            Something went wrong{this.props.section ? ` in ${this.props.section}` : ''}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6 text-center max-w-sm">
            An unexpected error occurred. Try reloading the page — if it keeps happening, reply to your advisor email and let us know.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
