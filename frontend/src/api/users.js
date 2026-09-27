import { api } from "./client.js";

export function listUsers() {
  return api.get("/users");
}

export function createUser({ username, password }) {
  return api.post("/users", { username, password });
}

export function updateUserPassword(id, password) {
  return api.post(`/users/${id}/password`, { password });
}

export function toggleUser(id) {
  return api.post(`/users/${id}/toggle`);
}
