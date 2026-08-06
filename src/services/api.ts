import { fetchJSONData, type APIOutput } from "squarecommons";
import { config } from "../config";
import type { RoomCreateResponseModel, RoomGetResponseModel } from "../types";

export type { APIOutput };
export type {
  RoomCreateRequestModel,
  RoomCreateResponseModel,
  RoomGetResponseModel,
} from "../types";

/**
 * Safely extracts payload data from APIOutput or direct object.
 */
function extractResponseData<T>(res: APIOutput | unknown): T {
  if (res && typeof res === "object" && "data" in res) {
    const wrapped = res as { data: T };
    if (wrapped.data) {
      return wrapped.data;
    }
  }
  return res as T;
}

/**
 * Calls POST /api/v1/room with user_id payload to create a new game room using squarecommons fetchJSONData.
 */
export async function createRoom(
  userId: string,
): Promise<RoomCreateResponseModel> {
  try {
    const res = await fetchJSONData(
      config.backendBaseUrl,
      "api/v1/room",
      "POST",
      undefined,
      { user_id: userId },
    );
    return extractResponseData<RoomCreateResponseModel>(res);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("failed to create room");
  }
}

/**
 * Calls GET /api/v1/room/{room_code} to check room status and joinability using squarecommons fetchJSONData.
 */
export async function getRoom(roomCode: string): Promise<RoomGetResponseModel> {
  try {
    const trimmedCode = roomCode.trim();
    const res = await fetchJSONData(
      config.backendBaseUrl,
      `api/v1/room/${encodeURIComponent(trimmedCode)}`,
      "GET",
    );
    return extractResponseData<RoomGetResponseModel>(res);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("room not found or network error");
  }
}
