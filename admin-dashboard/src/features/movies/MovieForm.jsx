import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  VideoCameraIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { categoryAPI } from "./categoryAPI";
import { moviesAPI } from "./moviesAPI";
import { tagAPI } from "./tagAPI";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 25 * 1024 * 1024 * 1024;
const CHUNK_SIZE = 20 * 1024 * 1024;
const MAX_PARALLEL_CHUNKS = 2;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"];
const SESSION_STORAGE_PREFIX = "movie_upload_session:";
const INITIAL_UPLOAD_STATUS = {
  state: "idle",
  progress: 0,
  fileName: "",
  speedKbps: 0,
  message: "",
};

const createInitialFormState = (data = {}) => ({
  title: data?.title || "",
  description: data?.description || "",
  price: data?.price || "",
  rating: data?.rating || "",
  actors: Array.isArray(data?.actors) ? data.actors.join(", ") : data?.actors || "",
  categoryId: data?.category?.id || data?.category?._id || "",
  tagIds: Array.isArray(data?.tags)
    ? data.tags.map((tag) => tag.id || tag._id).filter(Boolean)
    : [],
  newCategoryName: "",
  newTagName: "",
});

const Field = memo(function Field({
  name,
  label,
  type = "text",
  value,
  onChange,
  required = false,
}) {
  return (
    <label className="relative block">
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder=" "
        className="peer h-12 w-full rounded-xl border border-slate-300 bg-white px-3 pt-4 text-sm text-slate-900 outline-none transition duration-200 ease-in-out placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/25"
      />
      <span className="pointer-events-none absolute left-3 top-3 origin-left bg-transparent px-1 text-xs text-slate-500 transition peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs dark:text-slate-400 dark:peer-focus:text-blue-400">
        {label}
      </span>
    </label>
  );
});

const UploadZone = memo(function UploadZone({
  title,
  hint,
  icon,
  onFileSelect,
  accept,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDrop,
}) {
  const IconComponent = icon;

  return (
    <label
      onDragEnter={onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`glass-surface block cursor-pointer rounded-2xl border-2 border-dashed p-6 transition ${
        isDragging
          ? "border-blue-500 bg-blue-500/10"
          : "border-[var(--border-color)] hover:border-blue-400/70"
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
      />
      {IconComponent ? (
        <IconComponent className="h-7 w-7 text-[var(--text-muted)]" />
      ) : null}
      <p className="mt-3 font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{hint}</p>
      <span className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
        <ArrowUpTrayIcon className="h-4 w-4" />
        Browse file
      </span>
    </label>
  );
});

const UploadStatusCard = memo(function UploadStatusCard({
  uploadStatus,
  onCancelUpload,
}) {
  if (!uploadStatus || uploadStatus.state === "idle") return null;

  const isUploading = uploadStatus.state === "uploading";
  const isSuccess = uploadStatus.state === "success";
  const isError = uploadStatus.state === "error";
  const isCanceled = uploadStatus.state === "canceled";

  return (
    <div className="glass-surface sticky top-24 rounded-2xl p-4">
      <div className="flex items-start gap-2">
        {isSuccess ? (
          <CheckCircleIcon className="mt-0.5 h-5 w-5 text-emerald-400" />
        ) : isError || isCanceled ? (
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-amber-400" />
        ) : (
          <VideoCameraIcon className="mt-0.5 h-5 w-5 text-blue-400" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
            {uploadStatus.fileName || "movie-upload"}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {uploadStatus.message || "Preparing upload..."}
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isSuccess
              ? "bg-emerald-500"
              : isError || isCanceled
              ? "bg-amber-500"
              : "bg-blue-500"
          }`}
          style={{ width: `${Math.max(uploadStatus.progress || 0, isUploading ? 8 : 0)}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{uploadStatus.progress || 0}%</span>
        <span>{uploadStatus.speedKbps ? `${uploadStatus.speedKbps} KB/s` : "-"}</span>
      </div>

      {isUploading && (
        <button
          type="button"
          onClick={onCancelUpload}
          className="mt-3 inline-flex items-center gap-1 rounded-lg border border-red-500/35 bg-red-500/15 px-2.5 py-1.5 text-xs text-red-300 transition hover:bg-red-500/25"
        >
          <XCircleIcon className="h-4 w-4" />
          Cancel upload
        </button>
      )}
    </div>
  );
});

const MovieForm = ({
  initialData = {},
  onSubmit,
  loading,
  isEdit = false,
  uploadStatus,
  onCancelUpload,
}) => {
  const isSubmittingRef = useRef(false);
  const hydratedMovieIdRef = useRef(null);
  const uploadAbortRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localUploadStatus, setLocalUploadStatus] = useState(INITIAL_UPLOAD_STATUS);
  const [form, setForm] = useState(() => createInitialFormState(initialData));
  const [errors, setErrors] = useState({});
  const [coverPreview, setCoverPreview] = useState(initialData?.coverImageUrl || null);
  const [coverFile, setCoverFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isCoverDragging, setIsCoverDragging] = useState(false);
  const [isVideoDragging, setIsVideoDragging] = useState(false);

  // categories / tags
  const [categories, setCategories] = useState([]);
  const [tagsList, setTagsList] = useState([]);

  useEffect(() => {
    if (!isEdit) return;

    const movieId = initialData?.id || initialData?._id;
    if (!movieId || hydratedMovieIdRef.current === movieId) return;

    hydratedMovieIdRef.current = movieId;
    setForm(createInitialFormState(initialData));
    setCoverPreview(initialData.coverImageUrl || null);
    setCoverFile(null);
    setVideoFile(null);
  }, [initialData, isEdit]);

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  // fetch categories and tags for dropdowns
  useEffect(() => {
    let cancelled = false;
    const fetchLists = async () => {
      try {
        const [catResp, tagResp] = await Promise.all([
          categoryAPI.list(),
          tagAPI.list(),
        ]);
        if (!cancelled) {
          setCategories(Array.isArray(catResp?.data) ? catResp.data : []);
          setTagsList(Array.isArray(tagResp?.data) ? tagResp.data : []);
        }
      } catch {
        // ignore - admin page already authenticated
      }
    };
    fetchLists();
    return () => {
      cancelled = true;
    };
  }, []);

  const validateFile = useCallback((file, allowedTypes, maxSize, fieldName) => {
    if (!file) return null;
    if (!allowedTypes.includes(file.type)) return `${fieldName} type is not supported`;
    if (file.size > maxSize) return `${fieldName} exceeds allowed size`;
    return null;
  }, []);

  const setCover = useCallback(
    (file) => {
      if (!file) return;
      const fileError = validateFile(file, IMAGE_TYPES, MAX_IMAGE_SIZE, "Cover");
      if (fileError) {
        setErrors((prev) => ({ ...prev, cover: fileError }));
        return;
      }

      setErrors((prev) => ({ ...prev, cover: undefined }));
      setCoverFile(file);
      setCoverPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    },
    [validateFile]
  );

  const setVideo = useCallback(
    (file) => {
      if (!file) return;
      const fileError = validateFile(file, VIDEO_TYPES, MAX_VIDEO_SIZE, "Video");
      if (fileError) {
        setErrors((prev) => ({ ...prev, video: fileError }));
        return;
      }

      setErrors((prev) => ({ ...prev, video: undefined }));
      setVideoFile(file);
    },
    [validateFile]
  );

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const actorString = useMemo(() => form.actors.trim(), [form.actors]);

  const getFileFingerprint = useCallback((file) => {
    return `${file.name}:${file.size}:${file.lastModified}`;
  }, []);

  const getStoredSessionId = useCallback(
    (file) => localStorage.getItem(`${SESSION_STORAGE_PREFIX}${getFileFingerprint(file)}`),
    [getFileFingerprint]
  );

  const storeSessionId = useCallback(
    (file, sessionId) => {
      localStorage.setItem(`${SESSION_STORAGE_PREFIX}${getFileFingerprint(file)}`, sessionId);
    },
    [getFileFingerprint]
  );

  const clearStoredSessionId = useCallback(
    (file) => {
      localStorage.removeItem(`${SESSION_STORAGE_PREFIX}${getFileFingerprint(file)}`);
    },
    [getFileFingerprint]
  );

  const generateSessionId = useCallback(() => {
    if (window?.crypto?.randomUUID) {
      return window.crypto.randomUUID().replace(/[^a-zA-Z0-9-_]/g, "");
    }
    return `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }, []);

  const resolveActiveSession = useCallback(async (file, totalChunks) => {
    const storedSessionId = getStoredSessionId(file);
    if (storedSessionId) {
      try {
        const existing = await moviesAPI.getUploadSession(storedSessionId);
        if (
          existing?.success &&
          existing?.data?.fileName === file.name &&
          existing?.data?.totalSize === file.size &&
          existing?.data?.totalChunks === totalChunks &&
          existing?.data?.status !== "completed"
        ) {
          return existing.data;
        }
      } catch {
        // ignore and create a fresh session
      }
    }

    const sessionId = generateSessionId();
    const started = await moviesAPI.startUploadSession({
      sessionId,
      fileName: file.name,
      totalSize: file.size,
      totalChunks,
    });
    if (!started?.success || !started?.data) {
      throw new Error(started?.message || "Failed to start upload session");
    }

    storeSessionId(file, sessionId);
    return started.data;
  }, [generateSessionId, getStoredSessionId, storeSessionId]);

  const uploadVideoWithResume = useCallback(async (file) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const session = await resolveActiveSession(file, totalChunks);
    const sessionId = session.sessionId;

    const uploadedSet = new Set(Array.isArray(session.uploadedChunks) ? session.uploadedChunks : []);
    const bytesByChunk = {};
    for (const index of uploadedSet) {
      const start = index * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      bytesByChunk[index] = Math.max(end - start, 0);
    }

    const getUploadedBytes = () =>
      Object.values(bytesByChunk).reduce((sum, current) => sum + current, 0);

    const updateProgress = (message = "Uploading video chunks...") => {
      const uploadedBytes = getUploadedBytes();
      const progress = Math.min(100, Math.round((uploadedBytes * 100) / file.size));
      setLocalUploadStatus((prev) => ({
        ...prev,
        state: "uploading",
        fileName: file.name,
        progress,
        message,
      }));
    };

    updateProgress("Resuming upload...");

    const pendingIndexes = [];
    for (let index = 0; index < totalChunks; index += 1) {
      if (!uploadedSet.has(index)) {
        pendingIndexes.push(index);
      }
    }

    if (pendingIndexes.length) {
      uploadAbortRef.current = new AbortController();
      let cursor = 0;

      const worker = async () => {
        while (cursor < pendingIndexes.length) {
          const currentCursor = cursor;
          cursor += 1;
          const chunkIndex = pendingIndexes[currentCursor];

          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const blobChunk = file.slice(start, end);

          const chunkFormData = new FormData();
          chunkFormData.append("sessionId", sessionId);
          chunkFormData.append("chunkIndex", String(chunkIndex));
          chunkFormData.append("totalChunks", String(totalChunks));
          chunkFormData.append("fileName", file.name);
          chunkFormData.append("totalSize", String(file.size));
          chunkFormData.append("fileChunk", blobChunk, `${file.name}.part${chunkIndex}`);

          await moviesAPI.uploadChunk(chunkFormData, {
            signal: uploadAbortRef.current.signal,
            onUploadProgress: (event) => {
              bytesByChunk[chunkIndex] = Math.max(event.loaded || 0, bytesByChunk[chunkIndex] || 0);
              updateProgress(`Uploading chunk ${chunkIndex + 1}/${totalChunks}`);
            },
          });

          bytesByChunk[chunkIndex] = end - start;
          uploadedSet.add(chunkIndex);
          updateProgress(`Uploaded chunk ${chunkIndex + 1}/${totalChunks}`);
        }
      };

      const workers = [];
      const workerCount = Math.min(MAX_PARALLEL_CHUNKS, pendingIndexes.length);
      for (let i = 0; i < workerCount; i += 1) {
        workers.push(worker());
      }
      await Promise.all(workers);
    }

    setLocalUploadStatus((prev) => ({
      ...prev,
      state: "processing",
      message: "Finalizing upload...",
      progress: 100,
    }));

    const finalizeRes = await moviesAPI.finalizeUploadSession(sessionId);
    if (!finalizeRes?.success || !finalizeRes?.data?.videoUrl || !finalizeRes?.data?.cloudinaryPublicId) {
      throw new Error(finalizeRes?.message || "Failed to finalize upload");
    }

    clearStoredSessionId(file);
    setLocalUploadStatus((prev) => ({
      ...prev,
      state: "success",
      message: "Upload completed successfully",
      progress: 100,
    }));

    return {
      uploadSessionId: sessionId,
      videoUrl: finalizeRes.data.videoUrl,
      videoPublicId: finalizeRes.data.cloudinaryPublicId,
    };
  }, [clearStoredSessionId, resolveActiveSession]);

  const cancelLocalUpload = useCallback(() => {
    uploadAbortRef.current?.abort();
    setLocalUploadStatus((prev) => ({
      ...prev,
      state: "canceled",
      message: "Upload canceled",
    }));
    onCancelUpload?.();
  }, [onCancelUpload]);

  const handleAddCategory = useCallback(async () => {
    const categoryName = form.newCategoryName.trim();
    if (!categoryName) return;

    try {
      const res = await categoryAPI.create(categoryName);
      setCategories((prev) => [...prev, res.data]);
      setForm((prev) => ({
        ...prev,
        categoryId: res.data._id,
        newCategoryName: "",
      }));
    } catch (err) {
      console.error("category add failed", err);
    }
  }, [form.newCategoryName]);

  const handleAddTag = useCallback(async () => {
    const tagName = form.newTagName.trim();
    if (!tagName) return;

    try {
      const res = await tagAPI.create(tagName);
      setTagsList((prev) => [...prev, res.data]);
      setForm((prev) => ({
        ...prev,
        tagIds: prev.tagIds.includes(res.data._id)
          ? prev.tagIds
          : [...prev.tagIds, res.data._id],
        newTagName: "",
      }));
    } catch (err) {
      console.error("tag add failed", err);
    }
  }, [form.newTagName]);

  const validateForm = useCallback(() => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Title is required";
    if (!form.description.trim()) nextErrors.description = "Description is required";
    if (!String(form.price).trim()) nextErrors.price = "Price is required";
    if (!isEdit && !coverFile && !coverPreview) nextErrors.cover = "Cover image is required";
    if (!isEdit && !videoFile) nextErrors.video = "Video file is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [coverFile, coverPreview, form.description, form.price, form.title, isEdit, videoFile]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (loading || isSubmittingRef.current) return;

      if (!validateForm()) return;

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      try {
        setLocalUploadStatus(INITIAL_UPLOAD_STATUS);
        const formData = new FormData();
        formData.append("title", form.title.trim());
        formData.append("description", form.description.trim());
        formData.append("price", String(form.price));
        if (form.rating) formData.append("rating", String(form.rating));
        if (actorString) formData.append("actors", actorString);
        if (form.categoryId) formData.append("category", form.categoryId);
        if (form.tagIds.length) {
          form.tagIds.forEach((tagId) => formData.append("tags", tagId));
        }
        if (coverFile) formData.append("cover", coverFile);

        if (videoFile) {
          const uploadResult = await uploadVideoWithResume(videoFile);
          formData.append("uploadSessionId", uploadResult.uploadSessionId);
          formData.append("videoUrl", uploadResult.videoUrl);
          formData.append("videoPublicId", uploadResult.videoPublicId);
        }

        await onSubmit?.(formData);
      } catch (error) {
        const isCanceled =
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED" ||
          error?.message === "canceled";
        if (isCanceled) {
          setLocalUploadStatus((prev) => ({
            ...prev,
            state: "canceled",
            message: "Upload canceled",
          }));
          return;
        }

        setLocalUploadStatus((prev) => ({
          ...prev,
          state: "error",
          message: error?.message || "Upload failed",
        }));
        setErrors((prev) => ({
          ...prev,
          submit: error?.message || "Failed to submit movie form",
        }));
      } finally {
        uploadAbortRef.current = null;
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [
      actorString,
      coverFile,
      form.categoryId,
      form.description,
      form.price,
      form.rating,
      form.tagIds,
      form.title,
      loading,
      onSubmit,
      uploadVideoWithResume,
      validateForm,
      videoFile,
    ]
  );

  const effectiveUploadStatus = localUploadStatus.state === "idle" ? uploadStatus : localUploadStatus;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="card-surface rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {isEdit ? "Edit Movie Details" : "Add New Movie"}
          </h2>

          <Field name="title" label="Movie title" value={form.title} onChange={handleChange} required />
          {errors.title ? <p className="text-xs text-red-500">{errors.title}</p> : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              name="price"
              label="Price"
              type="number"
              value={form.price}
              onChange={handleChange}
              required
            />
            <Field
              name="rating"
              label="Rating"
              type="number"
              value={form.rating}
              onChange={handleChange}
            />
          </div>
          {errors.price ? <p className="text-xs text-red-500">{errors.price}</p> : null}

          <Field
            name="actors"
            label="Actors (comma separated)"
            value={form.actors}
            onChange={handleChange}
          />

          {/* category selection */}
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">Category</span>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/25"
            >
              <option value="">-- choose one --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}> {c.name} </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="New category"
              value={form.newCategoryName}
              onChange={(e) => setForm((prev) => ({ ...prev, newCategoryName: e.target.value }))}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/25"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="rounded-xl bg-blue-600 px-3 py-1 text-xs text-white"
            >
              Add
            </button>
          </div>

          {/* tag multi-select */}
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">Tags</span>
            <select
              multiple
              size={Math.min(5, tagsList.length || 5)}
              value={form.tagIds}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                setForm((prev) => ({ ...prev, tagIds: opts }));
              }}
              className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/25"
            >
              {tagsList.map((t) => (
                <option key={t._id} value={t._id}> {t.name} </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="New tag"
              value={form.newTagName}
              onChange={(e) => setForm((prev) => ({ ...prev, newTagName: e.target.value }))}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/25"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="rounded-xl bg-blue-600 px-3 py-1 text-xs text-white"
            >
              Add
            </button>
          </div>

          <label className="relative block">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder=" "
              className="peer w-full rounded-xl border border-slate-300 bg-white px-3 pt-5 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/25"
            />
            <span className="pointer-events-none absolute left-3 top-3 origin-left bg-transparent px-1 text-xs text-slate-500 transition peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs dark:text-slate-400 dark:peer-focus:text-blue-400">
              Description
            </span>
          </label>
          {errors.description ? <p className="text-xs text-red-500">{errors.description}</p> : null}
          {errors.submit ? <p className="text-xs text-red-500">{errors.submit}</p> : null}
        </section>

        <aside className="space-y-4">
          <div className="card-surface rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Upload Assets</h3>

            <UploadZone
              title="Cover image"
              hint="JPEG, PNG, WEBP up to 5MB"
              icon={PhotoIcon}
              accept="image/jpeg,image/png,image/webp"
              onFileSelect={setCover}
              isDragging={isCoverDragging}
              onDragEnter={() => setIsCoverDragging(true)}
              onDragLeave={() => setIsCoverDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsCoverDragging(false);
                setCover(event.dataTransfer.files?.[0] ?? null);
              }}
            />
            {errors.cover ? <p className="text-xs text-red-500">{errors.cover}</p> : null}

            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Cover preview"
                className="h-48 w-full rounded-xl object-cover"
                loading="lazy"
              />
            ) : null}

            <UploadZone
              title="Movie video"
              hint="MP4, WEBM, MOV (chunked resumable upload)"
              icon={VideoCameraIcon}
              accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
              onFileSelect={setVideo}
              isDragging={isVideoDragging}
              onDragEnter={() => setIsVideoDragging(true)}
              onDragLeave={() => setIsVideoDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsVideoDragging(false);
                setVideo(event.dataTransfer.files?.[0] ?? null);
              }}
            />
            {errors.video ? <p className="text-xs text-red-500">{errors.video}</p> : null}

            {videoFile ? (
              <p className="inline-flex items-center gap-1.5 text-xs text-emerald-500">
                <CheckCircleIcon className="h-4 w-4" />
                {videoFile.name}
              </p>
            ) : null}
          </div>

          <UploadStatusCard uploadStatus={effectiveUploadStatus} onCancelUpload={cancelLocalUpload} />
        </aside>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition transform hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ transitionProperty: "transform, box-shadow" }}
        >
          {loading || isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : isEdit ? (
            "Update Movie"
          ) : (
            "Create Movie"
          )}
        </button>
      </div>
    </form>
  );
};

export default memo(MovieForm);
