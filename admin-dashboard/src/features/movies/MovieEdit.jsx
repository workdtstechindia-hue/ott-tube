import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/ToastProvider";
import MovieForm from "./MovieForm";
import MoviePageBoundary from "./MoviePageBoundary";
import { moviesAPI } from "./moviesAPI";

const MovieEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await moviesAPI.getById(id);
        if (!res.success) throw new Error(res.message || "Failed to load movie");
        setMovie(res.data);
      } catch (err) {
        toast.error(err?.message || "Failed to load movie");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchMovie();
  }, [id, toast]);

  const handleUpdate = useCallback(
    async (formData) => {
      if (loading) return;

      try {
        setLoading(true);
        const res = await moviesAPI.update(id, formData);

        if (!res.success) throw new Error(res.message || "Failed to update movie");
        toast.success("Movie updated successfully");
        navigate("/movies");
      } catch (err) {
        toast.error(err?.message || "Failed to update movie");
      } finally {
        setLoading(false);
      }
    },
    [id, loading, navigate, toast]
  );

  if (initialLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <MoviePageBoundary>
      <MovieForm
        initialData={movie}
        onSubmit={handleUpdate}
        loading={loading}
        isEdit
      />
    </MoviePageBoundary>
  );
};

export default MovieEdit;
