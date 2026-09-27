import { api } from "./client.js";

export function login(username, password) {
  return api.post("/auth/login", { username, password });
}

export function logout() {
  return api.post("/auth/logout");
}

export function me() {
  return api.get("/auth/me");
}
