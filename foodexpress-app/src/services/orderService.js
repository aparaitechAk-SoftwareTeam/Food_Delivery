import api from "../utils/api";

const orderService = {
  getOrders: async () => {
    const { data } = await api.get("/orders");
    return data;
  },
  placeOrder: async (payload) => {
    const { data } = await api.post("/orders", payload);
    return data;
  },
  getOrderDetails: async (id) => {
    const { data } = await api.get(`/orders/${id}`);
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
