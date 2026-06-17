import { createApiClient } from "@orbit/api";

export const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_ORBIT_API_URL ?? "http://127.0.0.1:3737",
});
