import { useState, useEffect } from "react";

const MovieForm = ({
  initialData = {},
  onSubmit,
  loading,
  isEdit = false,
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    rating: "",
    actors: "",
  });

  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  useEffect(() => {
    if (initialData?.title) {
      setForm({
        title: initialData.title || "",
        description: initialData.description || "",
        price: initialData.price || "",
        rating: initialData.rating || "",
        actors: initialData.actors?.join(", ") || "",
      });

      setCoverPreview(initialData.coverImageUrl || null);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.price) {
      return alert("Please fill required fields.");
    }

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (form[key]) formData.append(key, form[key]);
    });

    if (coverFile) formData.append("cover", coverFile);
    if (videoFile) formData.append("video", videoFile);

    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-gray-900/40 rounded-xl p-6 space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Movie Title"
          className="border border-gray-300 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
          required
        />

        <input
          name="price"
          value={form.price}
          onChange={handleChange}
          type="number"
          placeholder="Price"
          className="border border-gray-300 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
          required
        />

        <input
          name="rating"
          value={form.rating}
          onChange={handleChange}
          type="number"
          placeholder="Rating"
          className="border border-gray-300 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
        />

        <input
          name="actors"
          value={form.actors}
          onChange={handleChange}
          placeholder="Actors (comma separated)"
          className="border border-gray-300 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
        />
      </div>

      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Description"
        className="border border-gray-300 dark:border-gray-700 p-3 rounded-lg w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
        rows={4}
        required
      />

      {/* Cover Upload */}
      <div>
        <label className="block mb-2 font-medium">Cover Image</label>
        <input type="file" accept="image/*" onChange={handleCoverChange} />
        {coverPreview && (
          <img
            src={coverPreview}
            alt="Preview"
            className="mt-3 w-40 rounded-lg shadow"
          />
        )}
      </div>

      {/* Video Upload */}
      <div>
        <label className="block mb-2 font-medium">Video File</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files[0])}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`px-6 py-2 rounded-xl text-white ${
          loading
            ? "bg-gray-400"
            : "bg-gray-900 hover:bg-gray-800"
        }`}
      >
        {loading
          ? "Saving..."
          : isEdit
          ? "Update Movie"
          : "Create Movie"}
      </button>
    </form>
  );
};

export default MovieForm;
