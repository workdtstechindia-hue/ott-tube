import { useEffect, useState } from "react";
import { moviesAPI } from "./moviesAPI";
import { useNavigate } from "react-router-dom";

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    const res = await moviesAPI.getAll();
    if (res.success) setMovies(res.data);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this movie?")) return;

    const res = await moviesAPI.delete(id);
    if (res.success) fetchMovies();
  };

  const filtered = movies.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <input
          placeholder="Search..."
          className="border border-gray-300 dark:border-gray-700 p-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => navigate("/movies/create")}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl"
        >
          Add Movie
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 rounded-xl overflow-x-auto">
        <table className="w-full text-sm text-gray-800 dark:text-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="p-3">Cover</th>
              <th className="p-3">Title</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Price</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((movie) => (
              <tr key={movie.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="p-3">
                  <img
                    src={movie.coverImageUrl}
                    className="w-14 rounded-lg"
                  />
                </td>
                <td className="p-3">{movie.title}</td>
                <td className="p-3">{movie.rating}</td>
                <td className="p-3">₹{movie.price}</td>
                <td className="p-3">
                  {new Date(movie.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() =>
                      navigate(`/movies/${movie.id}/edit`)
                    }
                    className="text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(movie.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MovieList;

// update with
// import useRole from "../../hooks/useRole";

// const { hasPermission } = useRole();

// {hasPermission("MOVIE_MANAGE") && (
//   <Button
//     onClick={() => navigate("/movies/create")}
//   >
//     Add Movie
//   </Button>
// )}
// For delete:
// {hasPermission("MOVIE_MANAGE") && (
//   <Button variant="danger">
//     Delete
//   </Button>
// )}
