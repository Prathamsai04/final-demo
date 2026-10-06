import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="max-w-md text-slate-500">An unexpected error occurred while rendering this page.</p>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => this.setState({ error: null })}>Try again</button>
          <a className="btn-primary" href="/">Go home</a>
        </div>
      </div>
    );
  }
}
