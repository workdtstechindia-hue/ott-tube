import api from "../../api/axios";

export const dashboardAPI = {
  getOverview: async () => {
    const response = await api.get(
      "/api/admin/dashboard/overview"
    );

    return response.data;
  },
};
