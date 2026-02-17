import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
          404
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          The requested URL does not exist in this admin panel.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
