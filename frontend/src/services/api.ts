import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

export async function fetchMatches() {
  try {
    const response = await api.get("/matches");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    throw error;
  }
}

export async function predictMatchWinner(data: any) {
  try {
    const response = await api.post("/predict/match-winner", data);
    return response.data;
  } catch (error) {
    console.error("Failed to predict match winner:", error);
    throw error;
  }
}

export default api;
