import { api } from "./client.js";

const CONFIRM_PHRASE = "RESTAURAR";

export function restoreDatabase(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("confirm_phrase", CONFIRM_PHRASE);
  return api.postForm("/backup/database/restore", formData);
}

export function restoreFiles(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("confirm_phrase", CONFIRM_PHRASE);
  return api.postForm("/backup/files/restore", formData);
}
