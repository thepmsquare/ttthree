import { config } from "../config";

/**
 * Returns a clean shareable URL for a given room code based on application config and window.location.origin.
 */
export function getShareableRoomUrl(roomCode: string): string {
  if (!roomCode) return "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`;
  return `${origin}${base}online/${encodeURIComponent(roomCode.trim())}`;
}
