import { useState, useEffect } from "react";
import { Button, Surface, Separator } from "@heroui/react";
import {
  ArrowLeft,
  RotateCcw,
  User,
  Trophy,
  Settings,
  X,
  Circle,
} from "lucide-react";
import { useNavigate } from "react-router";
import Grid from "../components/Grid";
import { WINNING_COMBINATIONS } from "../utils/constants";
import { config } from "../config";
import type { Board, GameWinner, Player } from "../types";

type GameState = "setup" | "playing";
type Difficulty = "easy" | "medium" | "hard";

export default function SinglePlayer() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [playerSide, setPlayerSide] = useState<Player>("X");
  const [cells, setCells] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [qTable, setQTable] = useState<Record<string, number[]> | null>(null);
  const [loading, setLoading] = useState(false);

  const opponentSide: Player = playerSide === "X" ? "O" : "X";

  // Game logic determination
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

  const isOpponentTurn =
    !winner &&
    ((opponentSide === "X" && isXNext) || (opponentSide === "O" && !isXNext));

  // Load the model dynamically when user starts the game
  const startGame = async () => {
    setLoading(true);
    try {
      let modelData: Record<string, number[]>;
      if (difficulty === "easy") {
        modelData = (await import("../models/ttthree_easy.json")).default;
      } else if (difficulty === "medium") {
        modelData = (await import("../models/ttthree_medium.json")).default;
      } else {
        modelData = (await import("../models/ttthree_hard.json")).default;
      }
      setQTable(modelData);
      setCells(Array(9).fill(null));
      setIsXNext(true);
      setGameState("playing");
    } catch (error) {
      console.error("failed to load model", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle opponent move logic
  useEffect(() => {
    if (gameState !== "playing" || !isOpponentTurn || !qTable) return;

    const baseDelay = config.opponentDelayBaseMs ?? 500;
    const variance = config.opponentDelayVarianceMs ?? 100;
    const randomVariance = (Math.random() * 2 - 1) * variance;
    const delay = Math.max(0, baseDelay + randomVariance);

    const timer = setTimeout(() => {
      // 1. Normalize board representation from Opponent's perspective:
      // active player (opponent) -> 1, player -> -1, empty -> 0
      const normalized = cells.map((cell) => {
        if (cell === opponentSide) return 1;
        if (cell === null) return 0;
        return -1;
      });
      const key = normalized.join(",");

      // 2. Gather available actions
      const emptyIndices: number[] = [];
      cells.forEach((c, idx) => {
        if (c === null) emptyIndices.push(idx);
      });

      if (emptyIndices.length === 0) return;

      let targetIndex = -1;
      const qValues = qTable[key];

      if (qValues) {
        let maxQ = -Infinity;
        let bestMoves: number[] = [];

        for (const idx of emptyIndices) {
          const q = qValues[idx];
          if (q > maxQ) {
            maxQ = q;
            bestMoves = [idx];
          } else if (q === maxQ) {
            bestMoves.push(idx);
          }
        }

        if (bestMoves.length > 0) {
          targetIndex = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
      }

      // Fallback
      if (targetIndex === -1) {
        console.warn(
          `q-table state not found: ${key}. falling back to random move.`,
        );
        targetIndex =
          emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }

      const nextCells = [...cells];
      nextCells[targetIndex] = opponentSide;
      setCells(nextCells);
      setIsXNext(!isXNext);
    }, delay);

    return () => clearTimeout(timer);
  }, [gameState, isOpponentTurn, cells, qTable, opponentSide, isXNext]);

  const handleCellClick = (index: number) => {
    if (cells[index] || winner || isOpponentTurn) return;

    const nextCells = [...cells];
    nextCells[index] = playerSide;
    setCells(nextCells);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setCells(Array(9).fill(null));
    setIsXNext(true);
  };

  // Status message matching local multiplayer formatting
  const statusMsg =
    winner === "draw"
      ? "it's a draw!"
      : winner
        ? `player ${winner.toLowerCase()} wins!`
        : `player ${isXNext ? "x" : "o"}'s turn`;

  if (gameState === "setup") {
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
              single player
            </h1>
            <div className="w-8" />
          </div>

          <Separator />

          <div className="flex flex-col gap-5">
            {/* Difficulty Selection */}
            <div className="flex flex-col gap-2">
              <div className="text-xs text-default-400 font-semibold tracking-wider">
                difficulty
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as const).map((diff) => {
                  const isSelected = difficulty === diff;
                  return (
                    <Button
                      key={diff}
                      variant={isSelected ? "primary" : "secondary"}
                      onClick={() => setDifficulty(diff)}
                      className={`w-full h-11 rounded-xl font-semibold transition-all duration-200 ${
                        isSelected ? "scale-[1.03]" : "hover:scale-[1.02]"
                      }`}
                    >
                      {diff}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Side Selection */}
            <div className="flex flex-col gap-2">
              <div className="text-xs text-default-400 font-semibold tracking-wider">
                play as
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={playerSide === "X" ? "primary" : "secondary"}
                  onClick={() => setPlayerSide("X")}
                  className={`w-full h-16 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 border-2 ${
                    playerSide === "X"
                      ? "border-danger bg-danger/10 text-danger hover:bg-danger/15"
                      : "border-transparent hover:scale-[1.02]"
                  }`}
                >
                  <X className="w-5 h-5 text-danger" />
                  <span className="text-xs font-semibold">goes first</span>
                </Button>
                <Button
                  variant={playerSide === "O" ? "primary" : "secondary"}
                  onClick={() => setPlayerSide("O")}
                  className={`w-full h-16 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 border-2 ${
                    playerSide === "O"
                      ? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
                      : "border-transparent hover:scale-[1.02]"
                  }`}
                >
                  <Circle className="w-5 h-5 text-primary" />
                  <span className="text-xs font-semibold">goes second</span>
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Start Button */}
          <Button
            variant="primary"
            className="w-full font-semibold h-11 rounded-xl"
            onClick={startGame}
            isDisabled={loading}
          >
            {loading ? "loading..." : "start game"}
          </Button>
        </Surface>
      </main>
    );
  }

  // Playing state
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
          <div className="text-center">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">
              single player ({difficulty})
            </h1>
          </div>
          <div className="w-8" />
        </div>

        <Separator />

        {/* Status display */}
        <div className="flex flex-col items-center justify-center py-2 text-center accent-font">
          <div className="text-sm text-default-500 tracking-wider mb-1">
            {winner ? "game over" : "current turn"}
          </div>
          <div className="text-2xl font-bold flex items-center gap-2 text-foreground">
            {winner && winner !== "draw" && (
              <Trophy className="w-6 h-6 text-warning" />
            )}
            {!winner && (
              <User
                className={`w-6 h-6 ${isXNext ? "text-danger" : "text-primary"}`}
              />
            )}
            <span>{statusMsg}</span>
          </div>
        </div>

        {/* Grid component */}
        <div className="flex justify-center w-full">
          <Grid
            cells={cells}
            onCellClick={handleCellClick}
            winningLine={winningLine}
            disabled={!!winner || isOpponentTurn}
          />
        </div>

        <Separator />

        {/* Control Buttons */}
        <div className="flex gap-2 w-full">
          <Button
            variant={winner ? "primary" : "secondary"}
            className="flex-1 font-semibold flex justify-center items-center gap-2"
            onClick={resetGame}
          >
            <RotateCcw className="w-4 h-4" />
            {winner ? "play again" : "reset game"}
          </Button>
          <Button
            isIconOnly
            variant="secondary"
            aria-label="settings"
            onClick={() => setGameState("setup")}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </Surface>
    </main>
  );
}
