import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MovieForm from "./MovieForm";
import { moviesAPI } from "./moviesAPI";

const MovieEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      const res = await moviesAPI.getById(id);
      if (res.success) setMovie(res.data);
    };
    fetchMovie();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setLoading(true);
      const res = await moviesAPI.update(id, formData);

      if (!res.success) throw new Error(res.message);

      alert("Movie updated successfully!");
      navigate("/movies");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MovieForm
      initialData={movie}
      onSubmit={handleUpdate}
      loading={loading}
      isEdit
    />
  );
};

export default MovieEdit;
