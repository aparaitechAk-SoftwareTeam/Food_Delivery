import api from "../utils/api";

const searchService = {
  searchAll: async (query) => {
    const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
    return data;
  },
};

export default searchService;
