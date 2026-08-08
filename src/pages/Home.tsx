import { useState, useEffect } from "react";
import { Button, Surface, Separator } from "@heroui/react";
import { useTheme } from "../contexts/theme";
import { User, Users, Globe, Sun, Moon, BarChart2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { config } from "../config";
import { pingBackend } from "../services/api";

export default function Home() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isOnlineAvailable, setIsOnlineAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    pingBackend().then((online) => {
      if (isMounted) {
        setIsOnlineAvailable(online);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background">
      <Surface className="flex w-full max-w-[340px] flex-col gap-6 rounded-3xl p-6" variant="default">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-3xl font-extrabold text-foreground accent-font tracking-tight">{config.appName}</h1>
          <p className="text-sm text-default-500">
            play tic tac toe.
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <Button 
            variant="primary" 
            className="w-full font-semibold flex justify-between items-center px-4"
            onClick={() => navigate("/single")}
          >
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              single player
            </span>
          </Button>

          <Button 
            variant="secondary" 
            className="w-full font-semibold flex justify-between items-center px-4"
            onClick={() => navigate("/local")}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              local multiplayer
            </span>
          </Button>

          <Button 
            variant="secondary" 
            className="w-full font-semibold flex justify-between items-center px-4"
            onClick={() => navigate("/online")}
            isDisabled={isOnlineAvailable !== true}
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              online multiplayer
            </span>
            {isOnlineAvailable === null && (
              <span className="flex items-center gap-1.5 text-[10px] text-default-400 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                pinging...
              </span>
            )}
            {isOnlineAvailable === false && (
              <span className="text-[10px] text-danger font-medium">(server unreachable)</span>
            )}
          </Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-xs text-default-400 px-1">
          <div>
            by{" "}
            <a
              href="https://thepmsquare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-foreground transition-colors duration-200 underline decoration-default-200 underline-offset-2"
            >
              thepmsquare
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label="statistics"
              onClick={() => navigate("/stats")}
              className="w-8 h-8 min-w-0 rounded-full"
            >
              <BarChart2 className="w-4 h-4" />
            </Button>

            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="w-8 h-8 min-w-0 rounded-full"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Surface>
    </main>
  );
}
