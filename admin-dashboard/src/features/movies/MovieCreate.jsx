import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/ToastProvider";
import MovieForm from "./MovieForm";
import MoviePageBoundary from "./MoviePageBoundary";
import { moviesAPI } from "./moviesAPI";

const MovieCreate = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleCreate = useCallback(
    async (formData) => {
      if (loading) return;

      try {
        setLoading(true);
        const res = await moviesAPI.create(formData);

        if (!res.success) throw new Error(res.message || "Failed to create movie");
        toast.success("Movie created successfully");
        navigate("/movies");
      } catch (err) {
        toast.error(err?.message || "Failed to create movie");
      } finally {
        setLoading(false);
      }
    },
    [loading, navigate, toast]
  );

  return (
    <MoviePageBoundary>
      <MovieForm onSubmit={handleCreate} loading={loading} />
    </MoviePageBoundary>
  );
};

export default MovieCreate;
