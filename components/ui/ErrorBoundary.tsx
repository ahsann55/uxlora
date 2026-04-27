"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  inline?: boolean; // true = small inline error, false = full page
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      if (this.props.inline) {
        return (
          <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-center">
            <p className="text-red-300 text-sm font-medium mb-2">
              Something went wrong loading this section.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              Try again
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="card max-w-md w-full text-center py-12 modal-enter">
            <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-white/50 text-sm mb-8 max-w-xs mx-auto">
              An unexpected error occurred. Your work is saved — try refreshing or go back to the dashboard.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-secondary text-sm px-5 py-2"
              >
                Try again
              </button>
              <a href="/dashboard" className="btn-primary text-sm px-5 py-2">
                Dashboard →
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}