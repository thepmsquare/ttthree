import { config } from "../config";
import type {
  WsMessage,
  StateUpdatePayload,
  ErrorPayload,
  WsCallbacks,
} from "../types";

export type {
  WsMessage,
  JoinRoomPayload,
  StateUpdatePayload,
  ErrorPayload,
  WsCallbacks,
} from "../types";

/**
 * Constructs the WebSocket URL for a given room code based on config.backendBaseUrl.
 * e.g. "http://localhost:8000" -> "ws://localhost:8000/ws/room/ROOM123"
 */
export function getWebSocketUrl(roomCode: string): string {
  const wsBaseUrl = config.backendBaseUrl.replace(/^http/, "ws").replace(/\/$/, "");
  return `${wsBaseUrl}/ws/room/${encodeURIComponent(roomCode.trim())}`;
}

/**
 * Manages WebSocket connection to /ws/room/{room_code}
 */
export class RoomWebSocket {
  private socket: WebSocket | null = null;
  private roomCode: string;
  private userId: string;
  private callbacks: WsCallbacks;

  constructor(roomCode: string, userId: string, callbacks: WsCallbacks) {
    this.roomCode = roomCode;
    this.userId = userId;
    this.callbacks = callbacks;
  }

  public connect(): void {
    const url = getWebSocketUrl(this.roomCode);

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        // Send JOIN_ROOM event with user_id payload on open
        this.send("JOIN_ROOM", { user_id: this.userId });
        this.callbacks.onConnect?.();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const data: WsMessage = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (error) {
          console.error("failed to parse websocket message:", event.data, error);
        }
      };

      this.socket.onerror = (error) => {
        console.error("websocket error:", error);
      };

      this.socket.onclose = () => {
        this.callbacks.onDisconnect?.();
      };
    } catch (err) {
      console.error("failed to connect to websocket:", err);
    }
  }

  private handleIncomingMessage(msg: WsMessage): void {
    const { event, payload } = msg;

    if (event === "STATE_UPDATE") {
      this.callbacks.onStateUpdate?.(payload as StateUpdatePayload);
    } else if (event === "ERROR") {
      this.callbacks.onError?.(payload as ErrorPayload);
    }
  }

  public send<T = unknown>(event: string, payload: T): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message: WsMessage<T> = { event, payload };
      this.socket.send(JSON.stringify(message));
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
