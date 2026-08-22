import { useState, useEffect, useCallback, useRef } from "react";
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
  Trophy,
  RotateCcw,
  AlertCircle,
  PauseCircle,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { createRoom, getRoom } from "../services/api";
import {
  RoomWebSocket,
  type StateUpdatePayload,
  type GameOverPayload,
  type ErrorPayload,
} from "../services/websocket";
import { useUser } from "../contexts/user";
import { getShareableRoomUrl } from "../utils/url";
import { recordOnlineMultiplayerResult } from "../utils/user";
import Grid from "../components/Grid";
import type { CellValue } from "../types";

type ViewState = "setup" | "lobby";

function formatCreatedAt(createdAtTimestamp?: number): string {
  if (!createdAtTimestamp) return "";
  const ms =
    createdAtTimestamp > 1e11
      ? createdAtTimestamp
      : createdAtTimestamp * 1000;
  const date = new Date(ms);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function OnlineMultiplayer() {
  const navigate = useNavigate();
  const params = useParams<{ roomCode?: string }>();
  const [searchParams] = useSearchParams();
  const { userId } = useUser();

  const [view, setView] = useState<ViewState>("setup");
  const [inputRoomCode, setInputRoomCode] = useState(
    () => params.roomCode || searchParams.get("room") || ""
  );
  const [activeRoomCode, setActiveRoomCode] = useState("");
  const [isJoinable, setIsJoinable] = useState<boolean | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Real-time WebSocket room & referee state
  const [wsConnected, setWsConnected] = useState(false);
  const [roomState, setRoomState] = useState<StateUpdatePayload | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverPayload | null>(null);

  const wsRef = useRef<RoomWebSocket | null>(null);
  const hasRecordedGameRef = useRef(false);
  const mySymbolRef = useRef<"X" | "O">("X");

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
    if (!urlRoomCode || view !== "setup") return;

    let isMounted = true;
    const trimmed = urlRoomCode.trim();
    if (!trimmed) return;

    Promise.resolve().then(async () => {
      if (!isMounted) return;
      setLoading(true);
      setLoadingMsg("checking room...");
      setErrorMsg("");

      try {
        const roomData = await getRoom(trimmed);
        if (!isMounted) return;
        setActiveRoomCode(roomData.room_code);
        setIsJoinable(roomData.is_joinable);

        if (roomData.is_joinable) {
          setIsHost(false);
          setView("lobby");
        } else {
          setErrorMsg("room is not joinable or full");
        }
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error) {
          setErrorMsg(err.message.toLowerCase());
        } else {
          setErrorMsg("room not found");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingMsg("");
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [params.roomCode, searchParams, view]);

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

  // Derive role and symbol calculations
  const effectiveIsHost = roomState
    ? roomState.host_user_id === userId
    : isHost;
  const derivedRole = effectiveIsHost ? "host" : "guest";

  const mySymbol: "X" | "O" = roomState
    ? roomState.current_x_player.toLowerCase() === "host"
      ? effectiveIsHost
        ? "X"
        : "O"
      : effectiveIsHost
        ? "O"
        : "X"
    : effectiveIsHost
      ? "X"
      : "O";

  const opponentSymbol: "X" | "O" = mySymbol === "X" ? "O" : "X";

  // Keep mySymbol in ref to prevent re-instantiating WebSocket on symbol change
  useEffect(() => {
    mySymbolRef.current = mySymbol;
  }, [mySymbol]);

  // WebSocket lifecycle management for room lobby & match
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

        // If a new match starts or continues, clear previous game over data
        if (data.status === "match_ongoing") {
          setGameOverData(null);
          hasRecordedGameRef.current = false;
        }
      },
      onGameOver: (data: GameOverPayload) => {
        setGameOverData(data);

        // Record statistics once
        if (!hasRecordedGameRef.current) {
          hasRecordedGameRef.current = true;
          let outcome: "win" | "loss" | "draw";
          if (data.winner === "DRAW") {
            outcome = "draw";
          } else if (data.winner === mySymbolRef.current) {
            outcome = "win";
          } else {
            outcome = "loss";
          }
          recordOnlineMultiplayerResult(outcome);
        }
      },
      onError: (data: ErrorPayload) => {
        if (data.message) {
          setErrorMsg(data.message.toLowerCase());
        }
      },
    });

    wsRef.current = ws;
    ws.connect();

    return () => {
      ws.disconnect();
      wsRef.current = null;
      setWsConnected(false);
      setRoomState(null);
      setGameOverData(null);
      hasRecordedGameRef.current = false;
    };
  }, [view, activeRoomCode, userId]);

  // Leave room flow
  const handleLeaveRoom = () => {
    wsRef.current?.leaveRoom();
    wsRef.current?.disconnect();
    wsRef.current = null;
    setView("setup");
    setActiveRoomCode("");
    setIsHost(false);
    setIsJoinable(null);
    setErrorMsg("");
    setWsConnected(false);
    setRoomState(null);
    setGameOverData(null);
    hasRecordedGameRef.current = false;
    navigate("/online", { replace: true });
  };

  // Cell click action
  const handleCellClick = (index: number) => {
    if (
      isMyTurn &&
      !gameOverData &&
      (roomState?.status === "ready" || roomState?.status === "match_ongoing") &&
      boardCells[index] === null
    ) {
      wsRef.current?.makeMove(index);
    }
  };

  // Rematch action
  const handleRequestRematch = () => {
    wsRef.current?.requestRematch();
  };

  const joinUrl = getShareableRoomUrl(activeRoomCode);

  // Turn status
  const isMyTurn =
    mySymbol === roomState?.current_turn &&
    (roomState?.status === "ready" ||
      roomState?.status === "match_ongoing") &&
    !gameOverData;

  // Both players connected check
  const isBothJoined =
    roomState?.status === "ready" ||
    roomState?.status === "match_ongoing" ||
    Boolean(
      roomState?.host_user_id &&
        roomState?.guest_user_id &&
        roomState?.host_connected &&
        roomState?.guest_connected
    );

  // Board cells conversion to CellValue[]
  const boardCells: CellValue[] = (
    roomState?.board || Array(9).fill("")
  ).map((c) => (c === "X" || c === "O" ? (c as CellValue) : null));

  // Determine current match screen state
  const isMatchScreen =
    roomState?.status === "ready" ||
    roomState?.status === "match_ongoing" ||
    roomState?.status === "paused" ||
    gameOverData !== null;

  const isDisconnectedScreen =
    roomState?.status === "missing_player" ||
    roomState?.status === "empty_lobby";

  // Copy shareable link to clipboard
  const handleCopyLink = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Scoreboard stats from roomState or gameOverData
  const scores =
    gameOverData?.previous_match_results ||
    roomState?.previous_match_results || {
      host_wins: 0,
      guest_wins: 0,
      draws: 0,
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
            {view === "setup"
              ? "online room"
              : isMatchScreen
                ? "online match"
                : "room lobby"}
          </h1>
          <div className="w-8 h-8" />
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-danger-100 p-3 text-center text-xs font-semibold text-danger dark:bg-danger-900/30">
            {errorMsg}
          </div>
        )}

        {/* View 1: Setup View */}
        {view === "setup" && (
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
        )}

        {/* View 2: Special Disconnected/Missing Player View */}
        {view === "lobby" && isDisconnectedScreen && (
          <div className="flex flex-col gap-5 text-center py-4">
            <div className="flex justify-center">
              <div className="p-3 bg-danger/10 rounded-full text-danger">
                <AlertCircle className="w-8 h-8" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-foreground">
                {roomState?.status === "missing_player"
                  ? "opponent left"
                  : "room closed"}
              </h2>
              <p className="text-xs text-default-500">
                {roomState?.status === "missing_player"
                  ? "opponent left the match."
                  : "room expired or was closed."}
              </p>
            </div>

            <Separator />

            <Button
              variant="primary"
              className="w-full font-semibold h-11 rounded-xl"
              onClick={handleLeaveRoom}
            >
              <span>return to menu</span>
            </Button>
          </div>
        )}

        {/* View 3: Active Game Board View */}
        {view === "lobby" && !isDisconnectedScreen && isMatchScreen && (
          <div className="flex flex-col gap-4">
            {/* Scoreboard */}
            <div className="flex items-center justify-between px-3 py-2 bg-default-100/60 rounded-2xl text-xs font-semibold text-default-500">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-default-400">
                  {effectiveIsHost
                    ? `you (host - ${mySymbol.toLowerCase()})`
                    : `host (${opponentSymbol.toLowerCase()})`}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {scores.host_wins}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-default-400">draws</span>
                <span className="text-sm font-bold text-foreground">
                  {scores.draws}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-default-400">
                  {!effectiveIsHost
                    ? `you (guest - ${mySymbol.toLowerCase()})`
                    : `guest (${opponentSymbol.toLowerCase()})`}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {scores.guest_wins}
                </span>
              </div>
            </div>

            {/* Paused Overlay Alert */}
            {roomState?.status === "paused" && (
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs font-medium text-center animate-pulse">
                <PauseCircle className="w-4 h-4" />
                <span>opponent disconnected. waiting for reconnection...</span>
              </div>
            )}

            {/* Player Turn Status Banner */}
            {!gameOverData &&
              (roomState?.status === "ready" ||
                roomState?.status === "match_ongoing") && (
                <div className="flex flex-col items-center justify-center py-1 text-center">
                  <div className="text-xs text-default-400 font-medium mb-1">
                    {isMyTurn ? "your turn" : "opponent's turn"}
                  </div>
                  <div className="flex items-center gap-2 text-base font-bold text-foreground">
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        isMyTurn
                          ? "bg-success/15 text-success animate-pulse"
                          : "bg-default-100 text-default-500"
                      }`}
                    >
                      {roomState?.current_turn === "X" ? (
                        <X className="w-3.5 h-3.5 text-danger stroke-[2.5]" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                      )}
                      <span>
                        turn: {roomState?.current_turn?.toLowerCase()}
                      </span>
                    </span>
                  </div>
                </div>
              )}

            {/* Game Over Summary Banner */}
            {gameOverData && (
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <div className="text-xs text-default-400 font-medium mb-1">
                  match finished
                </div>
                <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                  {gameOverData.winner !== "DRAW" &&
                    gameOverData.winner === mySymbol && (
                      <Trophy className="w-5 h-5 text-warning" />
                    )}
                  <span>
                    {gameOverData.winner === "DRAW"
                      ? "it's a draw!"
                      : gameOverData.winner === mySymbol
                        ? "you won!"
                        : "you lost!"}
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Grid */}
            <div className="flex justify-center w-full">
              <Grid
                cells={boardCells}
                onCellClick={handleCellClick}
                winningLine={gameOverData?.winning_line || null}
                disabled={
                  !isMyTurn ||
                  !!gameOverData ||
                  (roomState?.status !== "ready" &&
                    roomState?.status !== "match_ongoing")
                }
              />
            </div>

            <Separator />

            {/* In-Game / Game-Over Actions */}
            <div className="flex flex-col gap-2">
              {gameOverData ? (
                <>
                  <Button
                    variant="primary"
                    className="w-full font-semibold h-11 rounded-xl flex items-center justify-center gap-2"
                    onClick={handleRequestRematch}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>play again</span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full font-semibold h-11 rounded-xl"
                    onClick={handleLeaveRoom}
                  >
                    <span>quit to menu</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full font-semibold h-11 rounded-xl"
                  onClick={handleLeaveRoom}
                >
                  <span>leave match</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* View 4: Lobby View (not_started / ready) */}
        {view === "lobby" && !isDisconnectedScreen && !isMatchScreen && (
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
                    <X className="w-4 h-4 text-danger stroke-[2.5]" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                  )}
                </span>
                <span className="text-default-400 text-[10px]">
                  ({derivedRole})
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
                  console.log("[start game button clicked]", {
                    ws: wsRef.current,
                    roomCode: activeRoomCode,
                    roomState,
                    isBothJoined,
                  });
                  wsRef.current?.send("START_GAME", {});
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
