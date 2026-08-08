import { useState, useEffect, useCallback } from "react";
import { Button, Surface, Separator, Chip } from "@heroui/react";
import {
  ArrowLeft,
  Copy,
  Check,
  QrCode,
  Play,
  Loader2,
  X,
  Circle,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { createRoom, getRoom } from "../services/api";
import {
  RoomWebSocket,
  type StateUpdatePayload,
  type ErrorPayload,
} from "../services/websocket";
import { useUser } from "../contexts/user";
import { getShareableRoomUrl } from "../utils/url";

type ViewState = "setup" | "lobby";

function formatCreatedAt(createdAtTimestamp?: number): string {
  if (!createdAtTimestamp) return "";
  const ms = createdAtTimestamp > 1e11 ? createdAtTimestamp : createdAtTimestamp * 1000;
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function OnlineMultiplayer() {
  const navigate = useNavigate();
  const params = useParams<{ roomCode?: string }>();
  const [searchParams] = useSearchParams();
  const { userId } = useUser();

  const [view, setView] = useState<ViewState>("setup");
  const [inputRoomCode, setInputRoomCode] = useState("");
  const [activeRoomCode, setActiveRoomCode] = useState("");
  const [isJoinable, setIsJoinable] = useState<boolean | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Real-time WebSocket room state
  const [wsConnected, setWsConnected] = useState(false);
  const [roomState, setRoomState] = useState<StateUpdatePayload | null>(null);

  // Helper to join room via API
  const joinRoomApi = useCallback(async (codeToJoin: string) => {
    const trimmed = codeToJoin.trim();
    if (!trimmed) {
      setErrorMsg("please enter a room code");
      return;
    }

    setLoading(true);
    setLoadingMsg("checking room...");
    setErrorMsg("");

    try {
      const roomData = await getRoom(trimmed);
      setActiveRoomCode(roomData.room_code);
      setIsJoinable(roomData.is_joinable);

      if (roomData.is_joinable) {
        setIsHost(false);
        setView("lobby");
      } else {
        setErrorMsg("room is not joinable or full");
      }
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message.toLowerCase());
      } else {
        setErrorMsg("room not found");
      }
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  }, []);

  // Auto-detect room code from URL params or search query on mount (QR code scan deep linking)
  useEffect(() => {
    const urlRoomCode = params.roomCode || searchParams.get("room");
    if (urlRoomCode && view === "setup") {
      setInputRoomCode(urlRoomCode);
      joinRoomApi(urlRoomCode);
    }
  }, [params.roomCode, searchParams, view, joinRoomApi]);

  // Create room flow
  const handleCreateRoom = async () => {
    setLoading(true);
    setLoadingMsg("creating room...");
    setErrorMsg("");

    try {
      const newRoom = await createRoom(userId);
      setActiveRoomCode(newRoom.room_code);
      setIsHost(true);
      setIsJoinable(true);
      setView("lobby");

      // Update URL route to /online/:roomCode without full page reload
      navigate(`/online/${newRoom.room_code}`, { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message.toLowerCase());
      } else {
        setErrorMsg("failed to create room");
      }
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  // Manual Join room click
  const handleJoinClick = () => {
    joinRoomApi(inputRoomCode);
  };

  // WebSocket lifecycle management for room lobby
  useEffect(() => {
    if (view !== "lobby" || !activeRoomCode || !userId) return;

    const ws = new RoomWebSocket(activeRoomCode, userId, {
      onConnect: () => {
        setWsConnected(true);
      },
      onDisconnect: () => {
        setWsConnected(false);
      },
      onStateUpdate: (data: StateUpdatePayload) => {
        setRoomState(data);
        setIsHost(data.host_user_id === userId);
      },
      onError: (data: ErrorPayload) => {
        if (data.message) {
          setErrorMsg(data.message.toLowerCase());
        }
      },
    });

    ws.connect();

    return () => {
      ws.disconnect();
      setWsConnected(false);
      setRoomState(null);
    };
  }, [view, activeRoomCode, userId]);

  // Leave room flow
  const handleLeaveRoom = () => {
    setView("setup");
    setActiveRoomCode("");
    setIsHost(false);
    setIsJoinable(null);
    setErrorMsg("");
    setWsConnected(false);
    setRoomState(null);
    navigate("/online", { replace: true });
  };

  const joinUrl = getShareableRoomUrl(activeRoomCode);

  // Derive host status directly from WS roomState when available
  const effectiveIsHost = roomState
    ? roomState.host_user_id === userId
    : isHost;

  // Role can only be host or guest
  const derivedRole = effectiveIsHost ? "host" : "guest";

  // Derive starting symbol (X or O) based on current_x_player ("host" or "guest")
  const mySymbol = roomState
    ? roomState.current_x_player.toLowerCase() === derivedRole
      ? "X"
      : "O"
    : effectiveIsHost
      ? "X"
      : "O";

  // Both players connected check
  const isBothJoined = Boolean(
    roomState?.host_user_id &&
    roomState?.guest_user_id &&
    roomState?.host_connected &&
    roomState?.guest_connected,
  );

  // Copy shareable link to clipboard
  const handleCopyLink = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background">
      <Surface
        className="flex w-full max-w-[340px] flex-col gap-6 rounded-3xl p-6 shadow-xl"
        variant="default"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="secondary"
            aria-label="back to home"
            onClick={() => {
              if (view === "lobby") {
                handleLeaveRoom();
              } else {
                navigate("/");
              }
            }}
            className="w-8 h-8 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">
            online room
          </h1>
          <div className="w-8 h-8" />
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-danger-100 p-3 text-center text-xs font-semibold text-danger dark:bg-danger-900/30">
            {errorMsg}
          </div>
        )}

        {view === "setup" ? (
          <div className="flex flex-col gap-4">
            <Button
              variant="primary"
              className="w-full font-semibold h-11 rounded-xl"
              onClick={handleCreateRoom}
              isDisabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {loadingMsg || "creating..."}
                </span>
              ) : (
                "create room"
              )}
            </Button>

            <div className="relative flex items-center justify-center py-2">
              <Separator />
              <span className="absolute bg-background px-3 text-xs font-semibold text-default-400">
                or
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="enter room code"
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputRoomCode.trim()) {
                    handleJoinClick();
                  }
                }}
                className="w-full rounded-xl border border-default-200 bg-default-100/50 px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-foreground placeholder:text-default-400 focus:border-primary focus:outline-none dark:border-default-700"
              />

              <Button
                variant="secondary"
                className="w-full font-semibold h-11 rounded-xl"
                onClick={handleJoinClick}
                isDisabled={loading || !inputRoomCode.trim()}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {loadingMsg || "joining..."}
                  </span>
                ) : (
                  "join room"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Room Code Display with Copy Button */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-semibold text-default-400 uppercase tracking-wider">
                room code
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-widest text-primary font-mono">
                  {activeRoomCode}
                </span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="secondary"
                  aria-label="copy share link"
                  onClick={handleCopyLink}
                  className="w-8 h-8 rounded-full"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <span className="text-[10px] font-semibold text-success animate-fade-in">
                  copied link!
                </span>
              )}
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-default-900 rounded-2xl border border-default-200 shadow-sm">
              <div className="p-2 bg-white rounded-xl">
                <QRCodeSVG
                  value={joinUrl}
                  size={130}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="flex items-center gap-1 text-[11px] text-default-500 dark:text-default-400 font-medium">
                <QrCode className="w-3.5 h-3.5" />
                <span>scan qr code to join room</span>
              </div>
            </div>

            {/* Status Information */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-default-100/50 text-center gap-2">
              <div className="text-xs font-semibold text-default-500 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    wsConnected ? "bg-success" : "bg-warning animate-pulse"
                  }`}
                />
                <span>
                  {wsConnected ? "connected to server" : "connecting..."}
                </span>
              </div>

              {/* Display starting symbol X / O */}
              <div className="flex items-center gap-1.5 text-xs text-default-500 font-medium">
                <span>you play as:</span>
                <span className="flex items-center gap-1 font-bold text-foreground">
                  {mySymbol === "X" ? (
                    <>
                      <X className="w-4 h-4 text-danger stroke-[2.5]" />
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                    </>
                  )}
                </span>
              </div>

              {roomState?.created_at && (
                <div className="text-[10px] text-default-400 font-medium">
                  created at: {formatCreatedAt(roomState.created_at)}
                </div>
              )}

              {/* Prominent Hero UI Player Connection Status Chips */}
              <div className="flex items-center justify-center gap-2 my-1">
                <Chip
                  size="sm"
                  variant="soft"
                  color={
                    roomState
                      ? roomState.host_connected
                        ? "success"
                        : "danger"
                      : "success"
                  }
                >
                  host:{" "}
                  {roomState
                    ? roomState.host_connected
                      ? "online"
                      : "offline"
                    : "online"}
                </Chip>
                <Chip
                  size="sm"
                  variant="soft"
                  color={
                    roomState
                      ? roomState.guest_user_id
                        ? roomState.guest_connected
                          ? "success"
                          : "danger"
                        : "warning"
                      : "warning"
                  }
                >
                  guest:{" "}
                  {roomState
                    ? roomState.guest_user_id
                      ? roomState.guest_connected
                        ? "online"
                        : "offline"
                      : "waiting..."
                    : "waiting..."}
                </Chip>
              </div>

              <div className="text-xs font-medium text-foreground">
                {isBothJoined ? (
                  <span className="text-success font-semibold">
                    both players connected! start game when ready.
                  </span>
                ) : roomState?.status ? (
                  <span>status: {roomState.status}</span>
                ) : effectiveIsHost ? (
                  <span>waiting for player 2 to join...</span>
                ) : isJoinable ? (
                  <span>room is joinable. waiting for host...</span>
                ) : (
                  <span>room joined. waiting for host...</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Control Buttons */}
            <div className="flex flex-col gap-2">
              {/* Start Game Button (Disabled until both players joined) */}
              <Button
                variant="primary"
                className="w-full font-semibold h-11 rounded-xl flex items-center justify-center gap-2"
                isDisabled={!isBothJoined}
                onClick={() => {
                  // Stub action - does nothing for now as requested
                }}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>start game</span>
              </Button>

              <Button
                variant="secondary"
                className="w-full font-semibold h-11 rounded-xl"
                onClick={handleLeaveRoom}
              >
                <span>leave room</span>
              </Button>
            </div>
          </div>
        )}
      </Surface>
    </main>
  );
}
