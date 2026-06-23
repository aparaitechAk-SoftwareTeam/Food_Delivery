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
};

export default orderService;
