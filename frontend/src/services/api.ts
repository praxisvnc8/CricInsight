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

export async function fetchTopBatsmen() {
  try {
    const response = await api.get("/players/top-batsmen");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch top batsmen:", error);
    throw error;
  }
}

export async function fetchTopBowlers() {
  try {
    const response = await api.get("/players/top-bowlers");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch top bowlers:", error);
    throw error;
  }
}

export async function fetchPlayerStats(playerName: string) {
  try {
    const response = await api.get(`/players/stats/${playerName}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch stats for ${playerName}:`, error);
    throw error;
  }
}

export default api;
