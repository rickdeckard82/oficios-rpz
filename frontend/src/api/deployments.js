import { api } from "./client.js";

export function listDeployments({ page = 1, perPage = 20, deploymentType = "", status = "" } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  if (deploymentType) params.set("deployment_type", deploymentType);
  if (status) params.set("status", status);
  return api.get(`/deployments?${params.toString()}`);
}

export function getDeployment(id) {
  return api.get(`/deployments/${id}`);
}
