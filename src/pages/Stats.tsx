import { Button, Surface, Separator } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useUser } from "../contexts/user";

export default function Stats() {
  const navigate = useNavigate();
  const { profile } = useUser();
  const stats = profile?.stats;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background">
      <Surface
        className="flex w-full max-w-[340px] flex-col gap-6 rounded-3xl p-6"
        variant="default"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="secondary"
            aria-label="back to home"
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">
            statistics
          </h1>
          <div className="w-8" />
        </div>

        <Separator />

        {/* Content */}
        <div className="flex flex-col gap-5 text-xs">
          {/* Single Player Stats */}
          <div className="flex flex-col gap-2">
            <div className="font-bold text-foreground text-sm">single player</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col bg-default-100/50 p-2 rounded-xl">
                <span className="font-semibold text-default-500 mb-0.5">easy</span>
                <span className="font-bold text-foreground">
                  {stats?.singlePlayer?.easy?.wins ?? 0}w {stats?.singlePlayer?.easy?.losses ?? 0}l {stats?.singlePlayer?.easy?.draws ?? 0}d
                </span>
              </div>
              <div className="flex flex-col bg-default-100/50 p-2 rounded-xl">
                <span className="font-semibold text-default-500 mb-0.5">medium</span>
                <span className="font-bold text-foreground">
                  {stats?.singlePlayer?.medium?.wins ?? 0}w {stats?.singlePlayer?.medium?.losses ?? 0}l {stats?.singlePlayer?.medium?.draws ?? 0}d
                </span>
              </div>
              <div className="flex flex-col bg-default-100/50 p-2 rounded-xl">
                <span className="font-semibold text-default-500 mb-0.5">hard</span>
                <span className="font-bold text-foreground">
                  {stats?.singlePlayer?.hard?.wins ?? 0}w {stats?.singlePlayer?.hard?.losses ?? 0}l {stats?.singlePlayer?.hard?.draws ?? 0}d
                </span>
              </div>
            </div>
          </div>

          {/* Local Multiplayer Stats */}
          <div className="flex flex-col gap-2">
            <div className="font-bold text-foreground text-sm">local multiplayer</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col bg-default-100/50 p-2 rounded-xl">
                <span className="font-semibold text-default-500 mb-0.5">player x</span>
                <span className="font-bold text-danger">
                  {stats?.localMultiplayer?.xWins ?? 0} wins
                </span>
              </div>
              <div className="flex flex-col bg-default-100/50 p-2 rounded-xl">
                <span className="font-semibold text-default-500 mb-0.5">player o</span>
                <span className="font-bold text-primary">
                  {stats?.localMultiplayer?.oWins ?? 0} wins
                </span>
              </div>
              <div className="flex flex-col bg-default-100/50 p-2 rounded-xl">
                <span className="font-semibold text-default-500 mb-0.5">draws</span>
                <span className="font-bold text-foreground">
                  {stats?.localMultiplayer?.draws ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Online Multiplayer Stats */}
          <div className="flex flex-col gap-2">
            <div className="font-bold text-foreground text-sm">online multiplayer</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col bg-default-100/50 p-2 rounded-xl">
                <span className="font-semibold text-default-500 mb-0.5">wins</span>
                <span className="font-bold text-foreground">
                  {stats?.onlineMultiplayer?.wins ?? 0}
                </span>
              </div>
              <div className="flex flex-col bg-default-100/50 p-2 rounded-xl">
                <span className="font-semibold text-default-500 mb-0.5">losses</span>
                <span className="font-bold text-foreground">
                  {stats?.onlineMultiplayer?.losses ?? 0}
                </span>
              </div>
              <div className="flex flex-col bg-default-100/50 p-2 rounded-xl">
                <span className="font-semibold text-default-500 mb-0.5">draws</span>
                <span className="font-bold text-foreground">
                  {stats?.onlineMultiplayer?.draws ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Surface>
    </main>
  );
}
