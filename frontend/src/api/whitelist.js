import { api } from "./client.js";

export function listWhitelistDomains() {
  return api.get("/whitelist/domains");
}

export function createWhitelistDomain({ name, reason }) {
  return api.post("/whitelist/domains", { name, reason });
}

export function deleteWhitelistDomain(id) {
  return api.delete(`/whitelist/domains/${id}`);
}

export function listWhitelistIps() {
  return api.get("/whitelist/ips");
}

export function createWhitelistIp({ address, reason }) {
  return api.post("/whitelist/ips", { address, reason });
}

export function deleteWhitelistIp(id) {
  return api.delete(`/whitelist/ips/${id}`);
}
