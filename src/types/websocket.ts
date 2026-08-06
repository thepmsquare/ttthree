export interface WsMessage<T = unknown> {
  event: string;
  payload: T;
}

export interface JoinRoomPayload {
  user_id: string;
}

export interface StateUpdatePayload {
  room_code: string;
  your_role: string;
  status: string;
}

export interface ErrorPayload {
  code: string | number;
  message: string;
}

export interface WsCallbacks {
  onStateUpdate?: (data: StateUpdatePayload) => void;
  onError?: (data: ErrorPayload) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}
