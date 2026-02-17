import api from "../../api/axios";

export const purchasesAPI = {
  getAll: async () => {
    const response = await api.get("/api/admin/purchases");
    return response.data;
  },
};
