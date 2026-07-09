import { Button } from "@heroui/react";
import { X, Circle } from "lucide-react";
import type { GridProps } from "../types";

export default function Grid({
  cells,
  onCellClick,
  winningLine = null,
  disabled = false,
}: GridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[300px] aspect-square">
      {cells.map((cell, index) => {
        const isWinningCell = winningLine?.includes(index);
        
        return (
          <Button
            key={index}
            isIconOnly
            variant={isWinningCell ? "primary" : "secondary"}
            className={`w-full h-full aspect-square text-3xl font-bold rounded-2xl min-w-0 transition-all duration-200 ${
              isWinningCell 
                ? "bg-success text-success-foreground hover:bg-success/90" 
                : "hover:scale-[1.03] active:scale-[0.98]"
            }`}
            isDisabled={disabled || (cell !== null && !isWinningCell)}
            onClick={() => {
              if (cell === null && !disabled) {
                onCellClick?.(index);
              }
            }}
          >
            {cell === "X" && (
              <X 
                className={`w-8 h-8 ${
                  isWinningCell ? "text-success-foreground" : "text-danger"
                }`} 
              />
            )}
            {cell === "O" && (
              <Circle 
                className={`w-8 h-8 ${
                  isWinningCell ? "text-success-foreground" : "text-primary"
                }`} 
              />
            )}
          </Button>
        );
      })}
    </div>
  );
}
