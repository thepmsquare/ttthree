import { Button, Surface, Separator } from "@heroui/react";
import { useTheme } from "../contexts/ThemeContext";

export default function Home() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background">
      <Surface className="flex w-full max-w-[340px] flex-col gap-6 rounded-3xl p-6" variant="default">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-3xl font-extrabold text-foreground accent-font tracking-tight">ttthree</h1>
          <p className="text-sm text-default-500">
            play tic tac toe.
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <Button variant="primary" className="w-full font-semibold">
            single player
          </Button>
          <Button variant="secondary" className="w-full font-semibold">
            local multiplayer
          </Button>
          <Button variant="secondary" className="w-full font-semibold">
            online multiplayer
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

          <Button
            isIconOnly
            size="sm"
            variant="secondary"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="w-8 h-8 min-w-0 rounded-full"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </Button>
        </div>
      </Surface>
    </main>
  );
}
