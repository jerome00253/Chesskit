import { Position, Square } from './core';

/**
 * Helper function to determine the piece role at a given square
 */
export function getPieceRoleAt(pos: Position, sq: Square): string {
  if (pos.board.pawn.has(sq)) return 'pawn';
  if (pos.board.knight.has(sq)) return 'knight';
  if (pos.board.bishop.has(sq)) return 'bishop';
  if (pos.board.rook.has(sq)) return 'rook';
  if (pos.board.queen.has(sq)) return 'queen';
  if (pos.board.king.has(sq)) return 'king';
  return 'piece'; // fallback
}

/**
 * Helper function to add piece roles to pattern based on squares
 */
export function addPiecesToPattern(pos: Position, squares: Square[]): string[] {
  return squares.map(sq => getPieceRoleAt(pos, sq));
}
