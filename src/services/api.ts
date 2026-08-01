import { config } from "../config";

export interface RoomCreateResponseModel {
  room_code: string;
}

export interface RoomGetResponseModel {
  room_code: string;
  is_joinable: boolean;
}

export interface StandardResponse<T> {
  data: T;
  message?: string | null;
  success?: boolean;
}

/**
 * Safely extracts payload data from direct response object or StandardResponse wrapper.
 */
function extractResponseData<T>(json: unknown): T {
  if (json && typeof json === "object" && "data" in json) {
    const wrapped = json as StandardResponse<T>;
    if (wrapped.data) {
      return wrapped.data;
    }
  }
  return json as T;
}

/**
 * Calls POST /room to create a new game room.
 */
export async function createRoom(userId?: string): Promise<RoomCreateResponseModel> {
  try {
    const response = await fetch(`${config.backendBaseUrl}/room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userId ? { user_id: userId } : {}),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(errorText || `failed to create room (${response.status})`);
    }

    const json = await response.json();
    return extractResponseData<RoomCreateResponseModel>(json);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("failed to create room");
  }
}

/**
 * Calls GET /room/{room_code} to check room status and joinability.
 */
export async function getRoom(roomCode: string): Promise<RoomGetResponseModel> {
  try {
    const trimmedCode = roomCode.trim();
    const response = await fetch(`${config.backendBaseUrl}/room/${encodeURIComponent(trimmedCode)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("room not found");
      }
      throw new Error(`failed to fetch room status (${response.status})`);
    }

    const json = await response.json();
    return extractResponseData<RoomGetResponseModel>(json);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("room not found or network error");
  }
}
