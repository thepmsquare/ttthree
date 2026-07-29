import { config } from "../config";

export interface ModeStats {
  wins: number;
  losses: number;
  draws: number;
}

export interface SinglePlayerStats {
  easy: ModeStats;
  medium: ModeStats;
  hard: ModeStats;
}

export interface LocalMultiplayerStats {
  xWins: number;
  oWins: number;
  draws: number;
}

export interface OnlineMultiplayerStats {
  wins: number;
  losses: number;
  draws: number;
  roomsCreated: number;
  roomsJoined: number;
}

export interface UserProfile {
  userId: string;
  createdAt: string;
  stats: {
    singlePlayer: SinglePlayerStats;
    localMultiplayer: LocalMultiplayerStats;
    onlineMultiplayer: OnlineMultiplayerStats;
  };
}

/**
 * Generates a random UUID (v4 format) with a safe fallback for older browsers.
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates initial user profile structure.
 */
function createInitialProfile(userId: string): UserProfile {
  return {
    userId,
    createdAt: new Date().toISOString(),
    stats: {
      singlePlayer: {
        easy: { wins: 0, losses: 0, draws: 0 },
        medium: { wins: 0, losses: 0, draws: 0 },
        hard: { wins: 0, losses: 0, draws: 0 },
      },
      localMultiplayer: {
        xWins: 0,
        oWins: 0,
        draws: 0,
      },
      onlineMultiplayer: {
        wins: 0,
        losses: 0,
        draws: 0,
        roomsCreated: 0,
        roomsJoined: 0,
      },
    },
  };
}

/**
 * Retrieves the persistent userId from localStorage or generates a new random UUID if missing.
 */
export function getOrCreateUserId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let userId = localStorage.getItem(config.userIdStorageKey);
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem(config.userIdStorageKey, userId);
  }

  // Ensure user profile object is also initialized in localStorage
  getUserProfile(userId);

  return userId;
}

/**
 * Retrieves or initializes the user profile object in localStorage.
 */
export function getUserProfile(explicitUserId?: string): UserProfile {
  const userId =
    explicitUserId || localStorage.getItem(config.userIdStorageKey) || generateUUID();
  if (!localStorage.getItem(config.userIdStorageKey)) {
    localStorage.setItem(config.userIdStorageKey, userId);
  }

  const storedProfile = localStorage.getItem(config.userProfileStorageKey);
  if (storedProfile) {
    try {
      const parsed = JSON.parse(storedProfile) as UserProfile;
      if (parsed && parsed.userId) {
        return parsed;
      }
    } catch {
      // If parsing fails, fall back to creating a new profile below
    }
  }

  const newProfile = createInitialProfile(userId);
  localStorage.setItem(config.userProfileStorageKey, JSON.stringify(newProfile));
  return newProfile;
}

/**
 * Updates the user profile in localStorage.
 */
export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(config.userProfileStorageKey, JSON.stringify(profile));
}

/**
 * Records a single player game result (win, loss, or draw) for a specific difficulty in localStorage.
 */
export function recordSinglePlayerResult(
  difficulty: "easy" | "medium" | "hard",
  result: "win" | "loss" | "draw"
): UserProfile {
  const profile = getUserProfile();
  const currentStats = profile.stats.singlePlayer[difficulty] || {
    wins: 0,
    losses: 0,
    draws: 0,
  };

  if (result === "win") {
    currentStats.wins += 1;
  } else if (result === "loss") {
    currentStats.losses += 1;
  } else if (result === "draw") {
    currentStats.draws += 1;
  }

  profile.stats.singlePlayer[difficulty] = currentStats;
  saveUserProfile(profile);
  return profile;
}
