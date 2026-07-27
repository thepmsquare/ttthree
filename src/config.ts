import type { AppConfig } from "./types";

export const config: AppConfig = {
  appName: "ttthree",
  defaultTheme: "dark",
  opponentDelayBaseMs: 500,
  opponentDelayVarianceMs: 100,
  backendBaseUrl:
    import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:8000",
};
