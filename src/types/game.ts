export type Player = "X" | "O";
export type CellValue = Player | null;
export type Board = CellValue[];
export type GameWinner = Player | "draw" | null;
