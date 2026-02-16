import axiosInstance from "../../services/axiosInstance";

export const purchasesAPI = {
  getAll: async () => {
    const response = await axiosInstance.get("/api/admin/purchases");
    return response.data;
  },
};
