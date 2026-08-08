export interface WsMessage<T = unknown> {
  event: string;
  payload: T;
}

export interface JoinRoomPayload {
  user_id: string;
}

export interface StateUpdatePayload {
  room_code: string;
  status: string;
  host_user_id: string;
  guest_user_id: string | null;
  current_x_player: string;
  created_at: number;
  host_connected: boolean;
  guest_connected: boolean;
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
