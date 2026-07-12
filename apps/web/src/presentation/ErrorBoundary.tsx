import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-00 flex flex-col items-center justify-center p-4">
          <div className="bg-surface-01 border border-border-default rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">Something went wrong.</h2>
            <p className="text-text-secondary mb-6">
              An unexpected error occurred. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <pre className="mt-6 text-left text-xs text-text-tertiary overflow-auto p-4 bg-surface-00 rounded-lg">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
