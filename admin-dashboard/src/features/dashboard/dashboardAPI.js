import axiosInstance from "../../services/axiosInstance";

export const dashboardAPI = {
  getOverview: async () => {
    const response = await axiosInstance.get(
      "/api/admin/dashboard/overview"
    );

    return response.data;
  },
};
