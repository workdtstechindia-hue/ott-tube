import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Unhandled UI error:", error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center bg-[var(--bg-primary)] px-4">
          <div className="max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              An unexpected error crashed this view. Reload to continue.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
