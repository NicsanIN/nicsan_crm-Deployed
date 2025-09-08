// src/meta.ts
type Meta = {
  API?: string | undefined;
  WS?: string | undefined;
  MOCK?: string | undefined;
  BUILD_TIME: string;
  COMMIT_SHA: string;
  MODE: string; // dev | production
};

export const META: Meta = Object.freeze({
  API: import.meta.env.VITE_API_BASE_URL,
  WS: import.meta.env.VITE_WEBSOCKET_URL,
  MOCK: import.meta.env.VITE_ENABLE_MOCK_DATA,
  BUILD_TIME: new Date().toISOString(),
  COMMIT_SHA: import.meta.env.VITE_COMMIT_SHA ?? 'unknown',
  MODE: import.meta.env.MODE,
});
