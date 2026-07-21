import api from "../utils/api";

const paymentService = {
  createOrder: async (amount, orderId) => {
    const { data } = await api.post("/payment/create-order", { amount, orderId });
    return data;
  },
  verifyPayment: async (paymentData) => {
    const { data } = await api.post("/payment/verify", paymentData);
    return data;
  },
  getPaymentStatus: async (paymentId) => {
    const { data } = await api.get(`/payment/status/${paymentId}`);
    return data;
  },
};

export default paymentService;
