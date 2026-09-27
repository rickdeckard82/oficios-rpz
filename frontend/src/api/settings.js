import { api } from "./client.js";

export function getCompanySettings() {
  return api.get("/company-settings");
}

export function updateCompanySettings(payload) {
  return api.put("/company-settings", payload);
}

export function getParameterSettings() {
  return api.get("/parameter-settings");
}

export function updateParameterSettings(payload) {
  return api.put("/parameter-settings", payload);
}

export function getCommunicationsConfig() {
  return api.get("/communications-config");
}
