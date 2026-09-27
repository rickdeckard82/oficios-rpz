import { api } from "./client.js";

export function getRpzPreview() {
  return api.get("/rpz");
}

export function deployRpz() {
  return api.post("/deploy/rpz", { confirm: true });
}
