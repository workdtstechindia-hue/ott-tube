import api from "../../api/axios";

export const tagAPI = {
  list: async () => {
    const res = await api.get("/api/tags");
    return res.data;
  },
  create: async (name) => {
    const res = await api.post("/api/tags", { name });
    return res.data;
  },
};
