import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const MovieCreate = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(initialUploadStatus);
  const abortControllerRef = useRef(null);

  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
    setUploadStatus((prev) => ({
      ...prev,
      state: "canceled",
      message: "Upload canceled",
    }));
    setLoading(false);
  }, []);

  const handleCreate = useCallback(
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

        const res = await moviesAPI.create(formData, {
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

        if (!res.success) throw new Error(res.message || "Failed to create movie");

        setUploadStatus((prev) => ({
          ...prev,
          state: "success",
          progress: 100,
          message: "Upload completed successfully",
        }));
        toast.success("Movie created successfully");
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
        toast.error(err?.message || "Failed to create movie");
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [loading, navigate, toast]
  );

  return (
    <MoviePageBoundary>
      <MovieForm
        onSubmit={handleCreate}
        loading={loading}
        uploadStatus={uploadStatus}
        onCancelUpload={cancelUpload}
      />
    </MoviePageBoundary>
  );
};

export default MovieCreate;
