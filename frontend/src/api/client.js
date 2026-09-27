const TOKEN_STORAGE_KEY = "oficios_rpz_token";

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

class ApiError extends Error {
  constructor(status, message, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, { method = "GET", body, isFormData = false, signal } = {}) {
  const headers = {};
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let requestBody = body;
  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`/api/v1${path}`, {
    method,
    headers,
    body: requestBody,
    signal,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (response.status === 401 && onUnauthorized) {
    onUnauthorized();
  }

  if (!response.ok) {
    const message = (data && data.error) || `Erro inesperado (HTTP ${response.status}).`;
    throw new ApiError(response.status, message, data);
  }

  if (!isJson) {
    return response;
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, body, opts) => request(path, { ...opts, method: "DELETE", body }),
  postForm: (path, formData, opts) =>
    request(path, { ...opts, method: "POST", body: formData, isFormData: true }),
};

// Downloads/visualizações exigem o header Authorization, que uma <a href>
// comum não envia. Busca o arquivo via fetch (com o token) e devolve o Blob
// junto com o nome de arquivo sugerido pelo servidor.
async function fetchBlob(path, fallbackFilename) {
  const token = getToken();
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/v1${path}`, { headers });

  if (response.status === 401 && onUnauthorized) {
    onUnauthorized();
  }

  if (!response.ok) {
    let message = `Erro inesperado (HTTP ${response.status}).`;
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // corpo não é JSON (comum em erro de proxy) — mantém mensagem genérica
    }
    throw new ApiError(response.status, message);
  }

  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackFilename;

  const blob = await response.blob();
  return { blob, filename };
}

export async function downloadFile(path, fallbackFilename = "download.txt") {
  const { blob, filename } = await fetchBlob(path, fallbackFilename);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function viewFile(path) {
  const { blob } = await fetchBlob(path);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  // não revoga a URL imediatamente: a aba nova ainda precisa carregá-la.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export { ApiError };
