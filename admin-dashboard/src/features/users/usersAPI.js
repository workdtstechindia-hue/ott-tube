import axiosInstance from "../../services/axiosInstance";

export const usersAPI = {
  getAll: async () => {
    const response = await axiosInstance.get("/api/admin/users");
    return response.data;
  },
};
