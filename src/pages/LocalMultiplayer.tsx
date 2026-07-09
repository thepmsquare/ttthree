import { useState } from "react";
import { Button, Surface, Separator } from "@heroui/react";
import { ArrowLeft, RotateCcw, User, Trophy } from "lucide-react";
import { useNavigate } from "react-router";
import Grid from "../components/Grid";
import { WINNING_COMBINATIONS } from "../utils/constants";
import type { Board, GameWinner } from "../types";

export default function LocalMultiplayer() {
  const navigate = useNavigate();
  const [cells, setCells] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  // Check game status
  let winner: GameWinner = null;
  let winningLine: number[] | null = null;

  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      winner = cells[a];
      winningLine = combo;
      break;
    }
  }

  if (!winner && cells.every((cell) => cell !== null)) {
    winner = "draw";
  }

  const handleCellClick = (index: number) => {
    if (cells[index] || winner) return;

    const nextCells = [...cells];
    nextCells[index] = isXNext ? "X" : "O";
    setCells(nextCells);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setCells(Array(9).fill(null));
    setIsXNext(true);
  };

  // Status message
  const statusMsg = winner === "draw"
    ? "it's a draw!"
    : winner
      ? `player ${winner} wins!`
      : `player ${isXNext ? "X" : "O"}'s turn`;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background">
      <Surface className="flex w-full max-w-[340px] flex-col gap-6 rounded-3xl p-6" variant="default">
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
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">local multiplayer</h1>
          </div>
        </div>

        <Separator />

        {/* Status display */}
        <div className="flex flex-col items-center justify-center py-2 text-center accent-font">
          <div className="text-sm text-default-500 tracking-wider mb-1">
            {winner ? "game over" : "current turn"}
          </div>
          <div className="text-2xl font-bold flex items-center gap-2 text-foreground">
            {winner && winner !== "draw" && <Trophy className="w-6 h-6 text-warning" />}
            {!winner && <User className={`w-6 h-6 ${isXNext ? "text-danger" : "text-primary"}`} />}
            <span>{statusMsg}</span>
          </div>
        </div>

        {/* The Grid component */}
        <div className="flex justify-center w-full">
          <Grid
            cells={cells}
            onCellClick={handleCellClick}
            winningLine={winningLine}
            disabled={!!winner}
          />
        </div>

        <Separator />

        {/* Control Button */}
        <Button
          variant={winner ? "primary" : "secondary"}
          className="w-full font-semibold flex justify-center items-center gap-2"
          onClick={resetGame}
        >
          <RotateCcw className="w-4 h-4" />
          {winner ? "play again" : "reset game"}
        </Button>
      </Surface>
    </main>
  );
}
