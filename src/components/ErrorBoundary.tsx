import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200 p-8 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              {this.props.fallbackTitle || 'Unable to display this view'}
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={this.reset}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
              <a
                href="/admin"
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 inline-flex items-center gap-1.5 transition"
              >
                <Home className="w-3.5 h-3.5" /> Refresh Admin
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
