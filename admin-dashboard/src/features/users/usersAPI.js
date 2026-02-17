import api from "../../api/axios";

export const usersAPI = {
  getAll: async () => {
    const response = await api.get("/api/admin/users");
    return response.data;
  },
};
