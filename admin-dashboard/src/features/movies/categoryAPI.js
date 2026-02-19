import api from "../../api/axios";

export const categoryAPI = {
  list: async () => {
    const res = await api.get("/api/categories");
    return res.data;
  },
  create: async (name) => {
    const res = await api.post("/api/categories", { name });
    return res.data;
  },
};
