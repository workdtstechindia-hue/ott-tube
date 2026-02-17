import api from "../../api/axios";

export const authAPI = {
  adminLogin: async (credentials) => {
    const response = await api.post(
      "/api/auth/admin/login",
      credentials
    );

    return response.data; // return full backend structure
  },
};
