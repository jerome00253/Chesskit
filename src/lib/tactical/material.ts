import { Position, Square } from "./core";

/**
 * Standard material values for chess pieces.
 * Based on classical evaluation (pawn = 1 point).
 */
export const PIECE_VALUES: Record<string, number> = {
  'pawn': 1,
  'knight': 3,
  'bishop': 3,
  'rook': 5,
  'queen': 9,
  'king': 100  // King has symbolic value (checkmate = game over)
};

/**
 * Get the material value of a piece role.
 */
export function getMaterialValue(role: string): number {
  return PIECE_VALUES[role] || 0;
}

/**
 * Get the material value of a piece on a square.
 */
export function getSquareValue(pos: Position, sq: Square): number {
  const piece = pos.board.get(sq);
  if (!piece) return 0;
  
  const role = getRoleName(pos, sq);
  return getMaterialValue(role);
}

/**
 * Calculate the gain from a fork pattern.
 * Returns the value of the most valuable target.
 */
export function calculateForkGain(pos: Position, targets: Square[]): number {
  if (targets.length === 0) return 0;
  
  const values = targets.map(sq => getSquareValue(pos, sq));
  return Math.max(...values);
}

/**
 * Calculate the gain from a pin/skewer pattern.
 * For pins: value of the pinned piece (cannot move freely)
 * For skewers: value of the piece behind (will be captured)
 */
export function calculatePinGain(pos: Position, pinnedSq: Square, targetSq: Square, isSkewer: boolean = false): number {
  const pinnedValue = getSquareValue(pos, pinnedSq);
  const targetValue = getSquareValue(pos, targetSq);
  
  if (isSkewer) {
    // Skewer: back piece will be captured
    return targetValue;
  } else {
    // Pin: pinned piece restricted, value is context-dependent
    // For now, return pinned piece value as it's immobilized
    return pinnedValue;
  }
}

/**
 * Calculate the gain from capturing a hanging piece.
 * Returns the value of the hanging piece (free capture).
 */
export function calculateHangingGain(pos: Position, sq: Square): number {
  return getSquareValue(pos, sq);
}

/**
 * Calculate the value of an exchange (capture with recapture).
 * Positive = good exchange, Negative = bad exchange.
 * 
 * Example: Taking Queen (9) with Bishop (3) when Bishop is defended = +6
 */
export function calculateExchangeValue(
  capturedValue: number,
  attackerValue: number,
  isDefended: boolean
): number {
  if (!isDefended) {
    // Free capture
    return capturedValue;
  }
  
  // Exchange: we gain captured piece but lose attacker
  return capturedValue - attackerValue;
}

/**
 * Calculate material gain for discovered attack.
 * Returns value of the piece that will be attacked after discovery.
 */
export function calculateDiscoveredGain(pos: Position, targetSq: Square): number {
  return getSquareValue(pos, targetSq);
}

/**
 * Calculate total material on the board for a side.
 * Useful for material balance calculations.
 */
export function calculateTotalMaterial(pos: Position, color: 'white' | 'black'): number {
  let total = 0;
  
  const pieces = pos.board[color];
  for (const sq of pieces) {
    total += getSquareValue(pos, sq);
  }
  
  return total;
}

/**
 * Calculate material balance (positive = white ahead, negative = black ahead).
 */
export function calculateMaterialBalance(pos: Position): number {
  const whiteMaterial = calculateTotalMaterial(pos, 'white');
  const blackMaterial = calculateTotalMaterial(pos, 'black');
  
  return whiteMaterial - blackMaterial;
}

/**
 * Helper: Get piece role name from square.
 */
function getRoleName(pos: Position, sq: Square): string {
  if (pos.board.pawn.has(sq)) return 'pawn';
  if (pos.board.knight.has(sq)) return 'knight';
  if (pos.board.bishop.has(sq)) return 'bishop';
  if (pos.board.rook.has(sq)) return 'rook';
  if (pos.board.queen.has(sq)) return 'queen';
  if (pos.board.king.has(sq)) return 'king';
  return 'piece';
}
