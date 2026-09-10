import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className="flex flex-col items-center justify-center min-h-screen p-8"
          style={{ background: '#FDFCF8' }}
          role="alert"
          aria-live="assertive"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-[#BE123C]/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#292524' }}>
            Something went wrong
          </h1>
          <p className="mb-6 max-w-md text-center" style={{ color: '#78716C' }}>
            We're sorry, but something unexpected happened. Please refresh the page or try again later.
          </p>
          {this.state.error && (
            <pre className="mb-6 p-4 rounded-lg text-xs overflow-auto max-w-lg w-full" style={{ background: '#FAF9F6', color: '#78716C', border: '1px solid #E7E5E4', fontFamily: 'IBM Plex Mono, monospace' }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="nexus-btn nexus-btn-primary"
            aria-label="Refresh page"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
