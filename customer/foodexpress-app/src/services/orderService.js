import api from "../utils/api";

const orderService = {
  getOrders: async () => {
    const { data } = await api.get("/orders");
    return data;
  },
  placeOrder: async (payload) => {
    console.log("[DEBUG] orderService.placeOrder URL:", api.defaults.baseURL + "/orders");
    console.log("[DEBUG] orderService.placeOrder headers:", api.defaults.headers);
    try {
      const { data } = await api.post("/orders", payload);
      return data;
    } catch (err) {
      console.error("[DEBUG] orderService.placeOrder catch error object:", err);
      throw err;
    }
  },
  getOrderDetails: async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },
  getOrderTracking: async (id) => {
    const { data } = await api.get(`/orders/${id}/tracking`);
    return data;
  },
  cancelOrder: async (id, reason) => {
    const { data } = await api.put(`/orders/${id}/cancel`, { reason });
    return data;
  },
  reorder: async (id) => {
    const { data } = await api.post(`/orders/${id}/reorder`);
    return data;
  },
};

export default orderService;
