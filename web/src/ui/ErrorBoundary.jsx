import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

// Ported from the old TabErrorBoundary: one crashed view must not take down the app.
// The error clears when `resetKey` changes (for example, on navigation).
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <section className="glass error-card">
          <AlertTriangle size={22} aria-hidden="true" />
          <h2>This page crashed</h2>
          <pre>{String(this.state.error?.message || this.state.error)}</pre>
          <button className="pbtn" onClick={() => this.setState({ error: null })}>
            <RotateCcw size={14} aria-hidden="true" /> Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
