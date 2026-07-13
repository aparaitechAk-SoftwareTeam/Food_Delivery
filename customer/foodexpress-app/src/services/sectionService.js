import api from "../utils/api";

const sectionService = {
  getSections: async () => {
    const { data } = await api.get("/sections");
    return data;
  },
};

export default sectionService;
