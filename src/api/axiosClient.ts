import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8000/api", 
  withCredentials: false,
});

export const tokenStorage = {
  get: () => {
    const raw = localStorage.getItem("tokens");
    return raw ? JSON.parse(raw) : null;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: (tokens: any | null) => {
    if (!tokens) {
      localStorage.removeItem("tokens");
      return;
    }
    localStorage.setItem("tokens", JSON.stringify(tokens));
  },
};

export default axiosClient;