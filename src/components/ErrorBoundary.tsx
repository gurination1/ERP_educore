import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[EduCore ErrorBoundary caught exception]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.hash = '#/dashboard';
      window.location.reload();
    }
  };

  private handleClearAndHome = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.hash = '#/';
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white text-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="inline-block bg-[#00236f] text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider">
              EDUCORE ERP • RUNTIME SAFEGUARD
            </div>
            <h1 className="text-base font-black text-[#00236f] uppercase">
              Application View Recovered
            </h1>
            <p className="text-[11px] text-gray-600">
              An unexpected UI rendering anomaly was caught and isolated to prevent system disruption.
            </p>
            {this.state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-left font-mono text-[10px] text-red-800 break-words max-h-56 overflow-y-auto space-y-1">
                <span className="font-bold block text-red-900 mb-1">Exception Details:</span>
                <div>{this.state.error.message || String(this.state.error)}</div>
                {this.state.error?.stack && (
                  <div className="text-[9px] text-red-600 border-t border-red-200 pt-1 mt-1 opacity-80 whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                  </div>
                )}
                {this.state.errorInfo?.componentStack && (
                  <div className="text-[9px] text-red-700 border-t border-red-200 pt-1 mt-1 opacity-90 whitespace-pre-wrap">
                    Component Stack: {this.state.errorInfo.componentStack.split('\n').slice(0, 4).join('\n')}
                  </div>
                )}
              </div>
            )}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px] font-bold">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl transition shadow-sm cursor-pointer"
              >
                RELOAD DASHBOARD
              </button>
              <button
                type="button"
                onClick={this.handleClearAndHome}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-sm cursor-pointer"
              >
                RESET TO LOGIN
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
