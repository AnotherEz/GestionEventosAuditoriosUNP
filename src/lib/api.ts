// ── Cliente HTTP hacia la API PHP ────────────────────────────────────────────

const BASE_URL =
  ((import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "")) ||
  "https://api-eventos-unp-production.up.railway.app";

const TOKEN_KEY = "unp_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(
      `${BASE_URL}/${path.replace(/^\/+/, "")}`,
      {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }
    );
  } catch (err) {
    console.error("Error de conexión:", err);

    throw new Error(
      "No fue posible conectarse con el servidor. Inténtelo nuevamente más tarde."
    );
  }

  const text = await response.text();

  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Respuesta no válida del servidor:", text);

      throw new Error(
        `El servidor devolvió una respuesta inválida (${response.status}).`
      );
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
    }

    throw new Error(
      data?.error ||
      data?.message ||
      `Error ${response.status}`
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};