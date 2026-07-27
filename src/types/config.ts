import type { Theme } from "./theme";

export interface AppConfig {
  appName: string;
  defaultTheme: Theme;
  opponentDelayBaseMs?: number;
  opponentDelayVarianceMs?: number;
  backendBaseUrl: string;
}
