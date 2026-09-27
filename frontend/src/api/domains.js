import { api } from "./client.js";

export function listDomains({ page = 1, perPage = 20, q = "", active } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  if (q) params.set("q", q);
  if (active !== undefined && active !== null) params.set("active", String(active));
  return api.get(`/domains?${params.toString()}`);
}

export function toggleDomain(id) {
  return api.post(`/domains/${id}/toggle`);
}
