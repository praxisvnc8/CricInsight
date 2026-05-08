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

export async function predictInningsScore(data: any) {
  try {
    const response = await api.post("/predict/innings-score", data);
    return response.data;
  } catch (error) {
    console.error("Failed to predict innings score:", error);
    throw error;
  }
}

export async function predictPlayerPerformance(data: any) {
  try {
    const response = await api.post("/predict/player-performance", data);
    return response.data;
  } catch (error) {
    console.error("Failed to predict player performance:", error);
    throw error;
  }
}

export async function fetchTossImpact() {
  try {
    const response = await api.get("/stats/toss-impact");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch toss impact:", error);
    throw error;
  }
}

export async function fetchScoreEvolution() {
  try {
    const response = await api.get("/stats/score-evolution");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch score evolution:", error);
    throw error;
  }
}

export default api;
