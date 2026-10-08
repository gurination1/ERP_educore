/**
 * Ultra-smooth SPA safe navigation back helper.
 * Pops browser history stack if previous SPA history exists;
 * otherwise gracefully updates route to fallbackPath via popstate event without full page reload.
 */
export function safeGoBack(fallbackPath: string = '/dashboard'): void {
  if (typeof window !== 'undefined') {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      window.history.back();
    } else {
      window.history.pushState(null, '', fallbackPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }
}
