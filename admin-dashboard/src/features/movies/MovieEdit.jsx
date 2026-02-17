import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/ToastProvider";
import MovieForm from "./MovieForm";
import MoviePageBoundary from "./MoviePageBoundary";
import { moviesAPI } from "./moviesAPI";

const initialUploadStatus = {
  state: "idle",
  progress: 0,
  fileName: "",
  speedKbps: 0,
  message: "",
};

const MovieEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState(initialUploadStatus);
  const abortControllerRef = useRef(null);

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

  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
    setUploadStatus((prev) => ({
      ...prev,
      state: "canceled",
      message: "Upload canceled",
    }));
    setLoading(false);
  }, []);

  const handleUpdate = useCallback(
    async (formData, options = {}) => {
      if (loading) return;

      const videoFile = formData.get("video");
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setUploadStatus({
          state: "uploading",
          progress: 0,
          fileName: videoFile?.name || "movie-upload",
          speedKbps: 0,
          message: "Uploading assets...",
        });

        let lastTime = Date.now();
        let lastLoaded = 0;

        const res = await moviesAPI.update(id, formData, {
          signal: abortControllerRef.current.signal,
          onUploadProgress: (event) => {
            if (!event.total) return;
            const now = Date.now();
            const elapsedSec = Math.max((now - lastTime) / 1000, 0.001);
            const loadedDiff = Math.max(event.loaded - lastLoaded, 0);
            const speedKbps = Math.round(loadedDiff / elapsedSec / 1024);
            const percent = Math.round((event.loaded * 100) / event.total);

            lastTime = now;
            lastLoaded = event.loaded;

            setUploadStatus((prev) => ({
              ...prev,
              state: "uploading",
              progress: percent,
              speedKbps,
            }));
            options.onProgress?.(percent);
          },
        });

        if (!res.success) throw new Error(res.message || "Failed to update movie");

        setUploadStatus((prev) => ({
          ...prev,
          state: "success",
          progress: 100,
          message: "Upload completed successfully",
        }));
        toast.success("Movie updated successfully");
        navigate("/movies");
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
          return;
        }
        setUploadStatus((prev) => ({
          ...prev,
          state: "error",
          message: err?.message || "Upload failed",
        }));
        toast.error(err?.message || "Failed to update movie");
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
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
        uploadStatus={uploadStatus}
        onCancelUpload={cancelUpload}
      />
    </MoviePageBoundary>
  );
};

export default MovieEdit;
