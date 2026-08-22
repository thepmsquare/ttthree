export interface WsMessage<T = unknown> {
  event: string;
  payload: T;
}

export interface JoinRoomPayload {
  user_id: string;
}

export interface MakeMovePayload {
  cell_index: number;
}

export interface PreviousMatchResults {
  host_wins: number;
  guest_wins: number;
  draws: number;
}

export type RoomGameStatus =
  | "not_started"
  | "ready"
  | "match_ongoing"
  | "paused"
  | "missing_player"
  | "empty_lobby"
  | string;

export interface StateUpdatePayload {
  room_code: string;
  status: RoomGameStatus;
  host_user_id: string;
  guest_user_id: string | null;
  current_x_player: "host" | "guest" | string;
  created_at: number;
  host_connected: boolean;
  guest_connected: boolean;
  board?: string[];
  current_turn?: "X" | "O" | string;
  previous_match_results?: PreviousMatchResults;
}

export interface GameOverPayload {
  winner: "X" | "O" | "DRAW" | string;
  winning_line: number[] | null;
  previous_match_results?: PreviousMatchResults;
}

export interface ErrorPayload {
  code: string | number;
  message: string;
}

export interface WsCallbacks {
  onStateUpdate?: (data: StateUpdatePayload) => void;
  onGameOver?: (data: GameOverPayload) => void;
  onError?: (data: ErrorPayload) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}
