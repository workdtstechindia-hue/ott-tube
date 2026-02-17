import {
  FilmIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../../components/ui/SearchBar";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/ToastProvider";
import { moviesAPI } from "./moviesAPI";

const MovieRow = memo(function MovieRow({ movie, onEdit, onDelete }) {
  return (
    <tr className="table-row h-14 transition">
      <td className="px-5 py-4 text-center align-middle">
        <img
          src={movie.coverImageUrl}
          alt={movie.title}
          loading="lazy"
          className="mx-auto h-12 w-10 rounded-md object-cover"
        />
      </td>
      <td className="max-w-[280px] px-5 py-4 text-center align-middle font-medium text-[var(--text-primary)]">
        <p className="truncate">{movie.title}</p>
      </td>
      <td className="max-w-[260px] px-5 py-4 text-center align-middle text-[var(--text-muted)]">
        <p className="truncate">{movie.actors?.join(", ") || "-"}</p>
      </td>
      <td className="w-28 px-5 py-4 text-center align-middle">{movie.rating || "-"}</td>
      <td className="w-28 px-5 py-4 text-center align-middle">Rs. {movie.price}</td>
      <td className="w-40 px-5 py-4 text-center align-middle text-[var(--text-muted)]">
        {new Date(movie.createdAt).toLocaleDateString()}
      </td>
      <td className="w-32 px-5 py-4 text-center align-middle">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(movie.id)}
            className="rounded-lg border border-[var(--border-color)] p-2 text-blue-600 transition hover:bg-blue-500/10"
            aria-label={`Edit ${movie.title}`}
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(movie.id)}
            className="rounded-lg border border-[var(--border-color)] p-2 text-red-600 transition hover:bg-red-500/10"
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

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this movie?")) return;

      const res = await moviesAPI.delete(id);
      if (res.success) {
        toast.success("Movie deleted");
        fetchMovies();
      }
    },
    [fetchMovies, toast]
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
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onSearch={setSearch}
          placeholder="Search by title or actor..."
        />
        <button
          type="button"
          onClick={() => navigate("/movies/create")}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-gray-800"
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
          <div className="max-h-[560px] overflow-auto">
            <table className="table-surface min-w-[900px] w-full table-fixed text-sm">
              <thead className="table-head sticky top-0 z-10 bg-[var(--table-bg)] text-xs uppercase tracking-wide">
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
              <tbody>
                {filteredMovies.map((movie) => (
                  <MovieRow
                    key={movie.id}
                    movie={movie}
                    onEdit={(id) => navigate(`/movies/${id}/edit`)}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default MovieList;
