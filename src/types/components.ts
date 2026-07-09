import type { CellValue } from "./game";

export interface GridProps {
  /** The 9-element array representing the board cells */
  cells: CellValue[];
  /** Callback when a cell is clicked */
  onCellClick?: (index: number) => void;
  /** Winning line indices to highlight, e.g. [0, 1, 2] */
  winningLine?: number[] | null;
  /** If true, the entire grid is non-interactive */
  disabled?: boolean;
}
