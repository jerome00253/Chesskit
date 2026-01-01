import { Position, Square, Side, SquareSet, getOppositeSide, getSquareName } from "../core";
import { TacticalPattern } from "../types";
import { knightAttacks, bishopAttacks, rookAttacks, queenAttacks, pawnAttacks, kingAttacks } from "chessops/attacks";
import { calculateForkGain } from "../material";


/**
 * Detects forks created by the move using chessops primitives.
 */
export function detectForks(
  pos: Position,
  movedSquare: Square,
  movedPieceRole: string,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const occupied = pos.board.occupied;

  // 1. Calculate attacks using chessops primitives
  let attacks: SquareSet;
  switch (movedPieceRole) {
    case 'knight': attacks = knightAttacks(movedSquare); break;
    case 'bishop': attacks = bishopAttacks(movedSquare, occupied); break;
    case 'rook':   attacks = rookAttacks(movedSquare, occupied); break;
    case 'queen':  attacks = queenAttacks(movedSquare, occupied); break;
    case 'king':   attacks = kingAttacks(movedSquare); break;
    case 'pawn':   attacks = pawnAttacks(side, movedSquare); break;
    default: return [];
  }

  // 2. Identify vulnerable targets
  const opponent = getOppositeSide(side);
  const enemies = pos.board[opponent];
  
  // Valuable pieces: King, Queen, Rook, Bishop, Knight
  // (We exclude pawns from "Tactical Forks" usually, unless it's a specific end-game fork)
  const valuableEnemies = enemies.intersect(
      pos.board.king
      .union(pos.board.queen)
      .union(pos.board.rook)
      .union(pos.board.bishop)
      .union(pos.board.knight)
  );

  const targets = attacks.intersect(valuableEnemies);

  // 3. Fork Condition: Attacking >= 2 valuable targets
  if (targets.size() >= 2) {
      const targetNames: string[] = [];
      for (const t of targets) {
          if (pos.board.king.has(t)) targetNames.push("King");
          else if (pos.board.queen.has(t)) targetNames.push("Queen");
          else if (pos.board.rook.has(t)) targetNames.push("Rook");
          else if (pos.board.bishop.has(t)) targetNames.push("Bishop");
          else if (pos.board.knight.has(t)) targetNames.push("Knight");
      }

      const gain = calculateForkGain(pos, Array.from(targets));

      patterns.push({
          theme: "Fork",
          squares: [getSquareName(movedSquare), ...Array.from(targets).map(getSquareName)], 
          pieces: [movedPieceRole, ...targetNames],
          gain,
          description: `Fork on ${targetNames.join(" and ")}`
      });
  }

  return patterns;
}
