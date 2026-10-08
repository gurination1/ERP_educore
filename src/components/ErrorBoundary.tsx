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
    window.location.href = '/dashboard';
  };

  private handleClearAndHome = () => {
    localStorage.removeItem('educore_jwt_token');
    localStorage.removeItem('educore_user_data');
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#001744] text-white flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white text-[#0f172a] rounded-lg shadow-2xl border-t-4 border-[#ea580c] p-6 text-center space-y-4">
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
              <div className="p-3 bg-red-50 border border-red-200 rounded text-left font-mono text-[10px] text-red-800 break-words max-h-36 overflow-y-auto">
                <span className="font-bold block text-red-900 mb-1">Exception Details:</span>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px] font-bold">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2 bg-[#00236f] hover:bg-[#001744] text-white rounded transition shadow-sm cursor-pointer"
              >
                RELOAD DASHBOARD
              </button>
              <button
                onClick={this.handleClearAndHome}
                className="w-full sm:w-auto px-4 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded transition shadow-sm cursor-pointer"
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
