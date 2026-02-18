import {
  FilmIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/ToastProvider";
import { moviesAPI } from "./moviesAPI";

const MovieRow = memo(function MovieRow({ movie, onEdit, onDelete }) {
  return (
    <tr className="table-row block rounded-xl border border-[var(--border-color)] p-4 transition hover:bg-[var(--table-row-hover)] md:table-row md:h-14 md:rounded-none md:border-0 md:p-0">
      <td className="block text-left align-middle md:table-cell md:px-5 md:py-4 md:text-center">
        <div className="w-full max-w-full overflow-hidden rounded-lg md:mx-auto">
          <img
            src={movie.coverImageUrl}
            alt={movie.title}
            loading="lazy"
            className="w-full h-auto rounded-lg object-cover max-h-48"
          />
        </div>
      </td>
      <td className="block max-w-none px-4 py-2 text-left align-middle font-medium text-[var(--text-primary)] md:table-cell md:max-w-[280px] md:px-5 md:py-4 md:text-center">
        <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-muted)] md:hidden">
          Title
        </span>
        <p className="whitespace-normal break-words md:truncate">{movie.title}</p>
      </td>
      <td className="block max-w-none px-4 py-2 text-left align-middle text-[var(--text-muted)] md:table-cell md:max-w-[260px] md:px-5 md:py-4 md:text-center">
        <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-muted)] md:hidden">
          Actors
        </span>
        <p className="whitespace-normal break-words md:truncate">{movie.actors?.join(", ") || "-"}</p>
      </td>
      <td className="block w-auto px-4 py-2 text-left align-middle md:table-cell md:w-28 md:px-5 md:py-4 md:text-center">
        <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-muted)] md:hidden">
          Rating
        </span>
        {movie.rating || "-"}
      </td>
      <td className="block w-auto px-4 py-2 text-left align-middle md:table-cell md:w-28 md:px-5 md:py-4 md:text-center">
        <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--text-muted)] md:hidden">
          Price
        </span>
        Rs. {movie.price}
      </td>
      <td className="hidden w-40 px-5 py-4 text-center align-middle text-[var(--text-muted)] md:table-cell">
        {new Date(movie.createdAt).toLocaleDateString()}
      </td>
      <td className="block w-auto px-4 pt-3 text-left align-middle md:table-cell md:w-32 md:px-5 md:py-4 md:text-center">
        <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:justify-center md:gap-2">
          <button
            type="button"
            onClick={() => onEdit(movie.id)}
            className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--border-color)] p-2 text-blue-600 transition hover:bg-blue-500/10 md:w-auto"
            aria-label={`Edit ${movie.title}`}
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(movie.id)}
            className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--border-color)] p-2 text-red-600 transition hover:bg-red-500/10 md:w-auto"
            aria-label={`Delete ${movie.title}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchMovies = useCallback(async () => {
    try {
      const res = await moviesAPI.getAll();
      if (res.success) {
        setMovies(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleDeleteClick = useCallback((movie) => {
    setMovieToDelete(movie);
  }, []);

  const handleDeleteConfirm = useCallback(
    async (id) => {
      if (!id || deleting) return;

      try {
        setDeleting(true);
        const res = await moviesAPI.delete(id);
        if (res.success) {
          toast.success("Movie deleted");
          setMovieToDelete(null);
          fetchMovies();
        }
      } catch (error) {
        toast.error(error?.friendlyMessage || "Failed to delete movie");
      } finally {
        setDeleting(false);
      }
    },
    [deleting, fetchMovies, toast]
  );

  const filteredMovies = useMemo(() => {
    if (!search.trim()) return movies;
    const query = search.toLowerCase().trim();

    return movies.filter((movie) => {
      const title = movie.title?.toLowerCase() || "";
      const actors = Array.isArray(movie.actors)
        ? movie.actors.join(" ").toLowerCase()
        : (movie.actors || "").toLowerCase();
      return title.includes(query) || actors.includes(query);
    });
  }, [movies, search]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-full sm:w-80" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  return (
    <section className="space-y-4 md:space-y-6">
      <header className="grid grid-cols-1 gap-4 md:flex md:items-center md:justify-between">
        <SearchBar
          value={search}
          onSearch={setSearch}
          placeholder="Search by title or actor..."
        />
        <button
          type="button"
          onClick={() => navigate("/movies/create")}
          className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-gray-800 md:w-auto md:self-start"
        >
          <PlusIcon className="h-5 w-5" />
          Add Movie
        </button>
      </header>

      <div className="card-surface overflow-hidden rounded-2xl">
        {filteredMovies.length === 0 ? (
          <div className="grid min-h-[340px] place-items-center px-6 py-10 text-center">
            <div>
              <FilmIcon className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
              <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
                No movies found
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Try changing search query or create a new movie.
              </p>
              <button
                type="button"
                onClick={() => navigate("/movies/create")}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                <PlusIcon className="h-4 w-4" />
                Create movie
              </button>
            </div>
          </div>
        ) : (
          <div className="max-h-[560px] overflow-y-auto px-3 py-3 md:px-0 md:py-0">
            <table className="movie-table-mobile table-surface w-full text-sm md:min-w-[900px] md:table-fixed">
              <thead className="table-head sticky top-0 z-10 hidden bg-[var(--table-bg)] text-xs uppercase tracking-wide md:table-header-group">
                <tr className="h-14">
                  <th className="w-20 px-5 py-4 text-center align-middle">Cover</th>
                  <th className="px-5 py-4 text-center align-middle">Title</th>
                  <th className="px-5 py-4 text-center align-middle">Actors</th>
                  <th className="w-28 px-5 py-4 text-center align-middle">Rating</th>
                  <th className="w-28 px-5 py-4 text-center align-middle">Price</th>
                  <th className="w-40 px-5 py-4 text-center align-middle">Created</th>
                  <th className="w-32 px-5 py-4 text-center align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="block space-y-4 md:table-row-group md:space-y-0">
                {filteredMovies.map((movie) => (
                  <MovieRow
                    key={movie.id}
                    movie={movie}
                    onEdit={(id) => navigate(`/movies/${id}/edit`)}
                    onDelete={() => handleDeleteClick(movie)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(movieToDelete)}
        onClose={() => {
          if (!deleting) setMovieToDelete(null);
        }}
        className="max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Delete Movie
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Are you sure you want to delete{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {movieToDelete?.title}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setMovieToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDeleteConfirm(movieToDelete?.id)}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default MovieList;
