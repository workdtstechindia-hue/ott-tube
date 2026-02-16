import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MovieForm from "./MovieForm";
import { moviesAPI } from "./moviesAPI";

const MovieCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (formData) => {
    try {
      setLoading(true);
      const res = await moviesAPI.create(formData);

      if (!res.success) throw new Error(res.message);

      alert("Movie created successfully!");
      navigate("/movies");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MovieForm onSubmit={handleCreate} loading={loading} />
  );
};

export default MovieCreate;
