import { api } from "./client.js";

export function listIpAddresses({ page = 1, perPage = 20, q = "", active } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  if (q) params.set("q", q);
  if (active !== undefined && active !== null) params.set("active", String(active));
  return api.get(`/ip-addresses?${params.toString()}`);
}

export function toggleIpAddress(id) {
  return api.post(`/ip-addresses/${id}/toggle`);
}

export function refreshWhois({ q = "", active } = {}) {
  const body = {};
  if (q) body.q = q;
  if (active !== undefined && active !== null) body.active = active;
  return api.post("/ip-addresses/whois-refresh", body);
}

export async function getIpConfigPreview() {
  const response = await api.get("/ip-addresses/config.txt");
  return response.text();
}

export function deployIpRoutes() {
  return api.post("/deploy/ip-routes", { confirm: true });
}
