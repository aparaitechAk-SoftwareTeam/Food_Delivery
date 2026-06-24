import api from "../utils/api";

const foodService = {
  getFoods: async (params) => {
    const { data } = await api.get("/foods", { params });
    return data;
  },
  getFoodDetails: async (id) => {
    const { data } = await api.get(`/foods/${id}`);
    return data;
  },
  getReviews: async (foodId) => {
    const { data } = await api.get(`/foods/${foodId}/reviews`);
    return data;
  },
};

export default foodService;
