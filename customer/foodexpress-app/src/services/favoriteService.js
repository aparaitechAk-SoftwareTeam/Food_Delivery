import api from "../utils/api";

const favoriteService = {
  getFavorites: async () => {
    const { data } = await api.get("/favorites");
    return data;
  },
  toggleFavorite: async (restaurantId) => {
    const { data } = await api.post("/favorites", { restaurantId });
    return data;
  },
};

export default favoriteService;
