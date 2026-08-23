import type { AppConfig } from "./types";

export const config: AppConfig = {
  appName: "ttthree",
  defaultTheme: "dark",
  opponentDelayBaseMs: 500,
  opponentDelayVarianceMs: 100,
  backendBaseUrl: "https://raspi.thepmsquare.com:30002",
  baseUrl: import.meta.env.BASE_URL || "/",
  userIdStorageKey: "ttthree_user_id",
  userProfileStorageKey: "ttthree_user_profile",
};
