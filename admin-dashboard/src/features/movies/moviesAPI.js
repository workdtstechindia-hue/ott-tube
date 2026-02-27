import api from "../../api/axios";

export const moviesAPI = {
  getAll: async () => {
    const res = await api.get("/api/admin/movies");
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/api/admin/movies/${id}`);
    return res.data;
  },

  create: async (formData, config = {}) => {
    const res = await api.post(
      "/api/admin/movies",
      formData,
      config
    );
    return res.data;
  },

  startUploadSession: async (payload) => {
    const res = await api.post("/api/upload/session/start", payload);
    return res.data;
  },

  getUploadSession: async (sessionId) => {
    const res = await api.get(`/api/upload/session/${sessionId}`);
    return res.data;
  },

  uploadChunk: async (formData, config = {}) => {
    const res = await api.post("/api/upload/chunk", formData, config);
    return res.data;
  },

  finalizeUploadSession: async (sessionId) => {
    const res = await api.post(`/api/upload/session/${sessionId}/finalize`);
    return res.data;
  },

  update: async (id, formData, config = {}) => {
    const res = await api.put(
      `/api/admin/movies/${id}`,
      formData,
      config
    );
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(
      `/api/admin/movies/${id}`
    );
    return res.data;
  },
};
