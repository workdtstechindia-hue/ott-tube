import axiosInstance from "../../services/axiosInstance";

export const authAPI = {
  adminLogin: async (credentials) => {
    const response = await axiosInstance.post(
      "/api/auth/admin/login",
      credentials
    );

    return response.data; // return full backend structure
  },
};
