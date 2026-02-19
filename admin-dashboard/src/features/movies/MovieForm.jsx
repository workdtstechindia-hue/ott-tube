import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  VideoCameraIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import api from "../../api/axios";
import { categoryAPI } from "./categoryAPI";
import { tagAPI } from "./tagAPI";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

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
        className="peer h-12 w-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 pt-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-400/40"
      />
      <span className="pointer-events-none absolute left-3 top-3 origin-left bg-transparent px-1 text-xs text-[var(--text-muted)] transition peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
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
  const [form, setForm] = useState(() => ({
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    rating: initialData?.rating || "",
    actors: Array.isArray(initialData?.actors)
      ? initialData.actors.join(", ")
      : initialData?.actors || "",
  }));
  const [errors, setErrors] = useState({});
  const [coverPreview, setCoverPreview] = useState(initialData?.coverImageUrl || null);
  const [coverFile, setCoverFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isCoverDragging, setIsCoverDragging] = useState(false);
  const [isVideoDragging, setIsVideoDragging] = useState(false);

  // categories / tags
  const [categories, setCategories] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category?.id || "");
  const [selectedTags, setSelectedTags] = useState(
    Array.isArray(initialData?.tags) ? initialData.tags.map((t) => t.id) : []
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  useEffect(() => {
    if (!initialData?.title) return;
    setForm({
      title: initialData.title || "",
      description: initialData.description || "",
      price: initialData.price || "",
      rating: initialData.rating || "",
      actors: Array.isArray(initialData.actors)
        ? initialData.actors.join(", ")
        : initialData.actors || "",
    });
    setCoverPreview(initialData.coverImageUrl || null);
    setSelectedCategory(initialData?.category?.id || "");
    setSelectedTags(
      Array.isArray(initialData?.tags) ? initialData.tags.map((t) => t.id) : []
    );
  }, [initialData]);

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
        const [{ data: catResp }, { data: tagResp }] = await Promise.all([
          categoryAPI.list(),
          tagAPI.list(),
        ]);
        if (!cancelled) {
          setCategories(catResp.data);
          setTagsList(tagResp.data);
        }
      } catch (err) {
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

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await categoryAPI.create(newCategoryName);
      setCategories((prev) => [...prev, res.data]);
      setSelectedCategory(res.data._id);
      setNewCategoryName("");
    } catch (err) {
      console.error("category add failed", err);
    }
  }, [newCategoryName]);

  const handleAddTag = useCallback(async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await tagAPI.create(newTagName);
      setTagsList((prev) => [...prev, res.data]);
      setSelectedTags((prev) => [...prev, res.data._id]);
      setNewTagName("");
    } catch (err) {
      console.error("tag add failed", err);
    }
  }, [newTagName]);

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
      try {
        const formData = new FormData();
        formData.append("title", form.title.trim());
        formData.append("description", form.description.trim());
        formData.append("price", String(form.price));
        if (form.rating) formData.append("rating", String(form.rating));
        if (actorString) formData.append("actors", actorString);
        if (selectedCategory) formData.append("category", selectedCategory);
        if (selectedTags.length) {
          selectedTags.forEach((t) => formData.append("tags", t));
        }
        if (coverFile) formData.append("cover", coverFile);
        if (videoFile) formData.append("video", videoFile);

        await onSubmit?.(formData);
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          submit: error?.message || "Failed to submit movie form",
        }));
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [actorString, coverFile, form.description, form.price, form.rating, form.title, loading, onSubmit, validateForm, videoFile]
  );

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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
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
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-sm"
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
              value={selectedTags}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                setSelectedTags(opts);
              }}
              className="mt-1 block w-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
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
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-sm"
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
              className="peer w-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 pt-5 text-sm text-[var(--text-primary)] outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-400/40"
            />
            <span className="pointer-events-none absolute left-3 top-3 origin-left bg-transparent px-1 text-xs text-[var(--text-muted)] transition peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
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
              hint="MP4, WEBM, MOV up to 500MB"
              icon={VideoCameraIcon}
              accept="video/mp4,video/webm,video/quicktime"
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

          <UploadStatusCard uploadStatus={uploadStatus} onCancelUpload={onCancelUpload} />
        </aside>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-500"
        >
          {loading ? (
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
