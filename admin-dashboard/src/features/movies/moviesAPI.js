import axiosInstance from "../../services/axiosInstance";

export const moviesAPI = {
  getAll: async () => {
    const res = await axiosInstance.get("/api/admin/movies");
    return res.data;
  },

  getById: async (id) => {
    const res = await axiosInstance.get(`/api/admin/movies/${id}`);
    return res.data;
  },

  create: async (formData) => {
    const res = await axiosInstance.post(
      "/api/admin/movies",
      formData
    );
    return res.data;
  },

  update: async (id, formData) => {
    const res = await axiosInstance.put(
      `/api/admin/movies/${id}`,
      formData
    );
    return res.data;
  },

  delete: async (id) => {
    const res = await axiosInstance.delete(
      `/api/admin/movies/${id}`
    );
    return res.data;
  },
};
