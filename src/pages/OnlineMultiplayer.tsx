import { Button, Surface, Separator } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function OnlineMultiplayer() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background">
      <Surface
        className="flex w-full max-w-[340px] flex-col gap-6 rounded-3xl p-6"
        variant="default"
      >
        {/* Header */}
        <div className="flex items-center gap-2">
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
          <div className="flex-1 text-center pr-8">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">
              online multiplayer
            </h1>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm font-medium text-default-500 accent-font">
            work in progress
          </p>
        </div>
      </Surface>
    </main>
  );
}
