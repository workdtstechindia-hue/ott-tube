import { Component } from "react";

class MoviePageBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Movie page render error:", error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Unable to load movie form
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            A rendering error occurred in this page. You can retry safely.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MoviePageBoundary;
