import { useState, useEffect, useCallback } from "react";
import { Button, Surface, Separator } from "@heroui/react";
import { ArrowLeft, Copy, Check, QrCode, Play, Loader2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { createRoom, getRoom } from "../services/api";
import { useUser } from "../contexts/user";

type ViewState = "setup" | "lobby";

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

  // Helper to join room via API
  const joinRoomApi = useCallback(
    async (codeToJoin: string) => {
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
    },
    []
  );

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

  // Leave room flow
  const handleLeaveRoom = () => {
    setView("setup");
    setActiveRoomCode("");
    setIsHost(false);
    setIsJoinable(null);
    setErrorMsg("");
    navigate("/online", { replace: true });
  };

  // Clean shareable URL helper (avoids double slashes like //online/)
  const getShareableUrl = (code: string) => {
    if (!code) return "";
    const origin = window.location.origin;
    const base = import.meta.env.BASE_URL || "/";
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    return `${origin}${normalizedBase}online/${encodeURIComponent(code)}`;
  };

  const joinUrl = getShareableUrl(activeRoomCode);

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
            {view === "lobby" ? "room lobby" : "online multiplayer"}
          </h1>
          <div className="w-8" />
        </div>

        <Separator />

        {/* View 1: Setup View */}
        {view === "setup" && (
          <div className="flex flex-col gap-5">
            {/* Create Room Section */}
            <div className="flex flex-col gap-2">
              <div className="text-xs text-default-400 font-semibold tracking-wider">
                host a game
              </div>
              <Button
                variant="primary"
                className="w-full font-semibold h-11 rounded-xl flex items-center justify-center gap-2"
                onClick={handleCreateRoom}
                isDisabled={loading}
              >
                {loading && loadingMsg === "creating room..." ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>creating room...</span>
                  </>
                ) : (
                  <span>create room</span>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-3 my-1">
              <Separator className="flex-1" />
              <span className="text-xs text-default-400 font-medium">or</span>
              <Separator className="flex-1" />
            </div>

            {/* Join Room Section */}
            <div className="flex flex-col gap-2">
              <div className="text-xs text-default-400 font-semibold tracking-wider">
                join existing room
              </div>
              <input
                type="text"
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value)}
                placeholder="enter room code"
                className="w-full h-11 px-4 rounded-xl bg-default-100/70 border border-default-200 text-foreground text-sm placeholder:text-default-400 focus:outline-none focus:border-primary transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoinClick();
                }}
              />
              <Button
                variant="secondary"
                className="w-full font-semibold h-11 rounded-xl flex items-center justify-center gap-2"
                onClick={handleJoinClick}
                isDisabled={loading || !inputRoomCode.trim()}
              >
                {loading && loadingMsg === "checking room..." ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>checking room...</span>
                  </>
                ) : (
                  <span>join room</span>
                )}
              </Button>
            </div>

            {/* Error Feedback Display */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs text-center font-medium">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* View 2: Room Lobby View */}
        {view === "lobby" && (
          <div className="flex flex-col gap-5">
            {/* Room Code Banner */}
            <div className="flex flex-col items-center gap-1 bg-default-100/50 p-4 rounded-2xl border border-default-200">
              <span className="text-xs text-default-400 font-medium">
                room code
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-widest text-foreground accent-font">
                  {activeRoomCode}
                </span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="secondary"
                  aria-label="copy link"
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
                <span className="text-[10px] text-success font-semibold">
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
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-default-100/50 text-center">
              <div className="text-xs font-semibold text-default-500 mb-1">
                status
              </div>
              <div className="text-xs font-medium text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                <span>
                  {isHost
                    ? "waiting for player 2 to join..."
                    : isJoinable
                      ? "room is joinable. waiting for host to start game..."
                      : "connected to room. waiting for host to start game..."}
                </span>
              </div>
            </div>

            <Separator />

            {/* Control Buttons */}
            <div className="flex flex-col gap-2">
              {/* Stub Start Game Button */}
              <Button
                variant="primary"
                className="w-full font-semibold h-11 rounded-xl flex items-center justify-center gap-2"
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
