import { Position, Square, Side, SquareSet, getPieceValue, getOppositeSide, getSquareName } from "../core";
import { TacticalPattern } from "../types";
import { knightAttacks, bishopAttacks, rookAttacks, queenAttacks, pawnAttacks, kingAttacks } from "chessops/attacks";

/**
 * Detects forks created by the move.
 * A fork is when the moved piece attacks two or more valuable targets simultaneously.
 */
export function detectForks(
  pos: Position, // Position AFTER the move
  movedSquare: Square, // Where the piece landed
  movedPieceRole: string,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  
  // 1. Get all squares attacked by the moved piece
  let attacks: SquareSet;
  const occupied = pos.board.occupied;

  switch (movedPieceRole) {
    case 'knight': attacks = knightAttacks(movedSquare); break;
    case 'bishop': attacks = bishopAttacks(movedSquare, occupied); break;
    case 'rook':   attacks = rookAttacks(movedSquare, occupied); break;
    case 'queen':  attacks = queenAttacks(movedSquare, occupied); break;
    case 'king':   attacks = kingAttacks(movedSquare); break;
    case 'pawn':   attacks = pawnAttacks(side, movedSquare); break;
    default: return [];
  }

  // 2. Filter for valuable targets belonging to the opponent
  const opponent = getOppositeSide(side);
  const opponentPieces = pos.board[opponent];
  
  // We care about attacks on:
  // - King (Check)
  // - Queen, Rook, Bishop, Knight
  // - Undefended Pawns? Maybe less critical for "Tactical Fork" unless double attack.
  // Let's stick to pieces > pawn or undefended pieces.
  
  const targets: Square[] = [];
  
  for (const targetSq of attacks) {
      if (opponentPieces.has(targetSq)) {
          // It's an enemy piece
          // Identify role
          let role = 'pawn';
          if (pos.board.king.has(targetSq)) role = 'king';
          else if (pos.board.queen.has(targetSq)) role = 'queen';
          else if (pos.board.rook.has(targetSq)) role = 'rook';
          else if (pos.board.bishop.has(targetSq)) role = 'bishop';
          else if (pos.board.knight.has(targetSq)) role = 'knight';
          
          const value = getPieceValue(role);
          // Removed unused attackerValue
          
          // Is it a "valuable" target?
          // 1. King (always valid target for check)
          // 2. Piece value > Attacker value
          // 3. Piece is undefended (Hanging) - Harder to check efficiently, but we can try simple getAttackers check
           
          // Simple Fork Definition: Attacking 2+ pieces.
          // Refined: Attacking 2+ pieces where at least one is > pawn.
          // Or King + anything.
          
          if (value > 3) { // Forking valuable pieces (Rook, Queen, King)
              targets.push(targetSq);
          } else {
             // It's a pawn. Only count if undefended?
             // Or if we are a pawn forks two pawns? (Rarely tactical unless endgame)
             // Let's exclude pawns for now to reduce noise, unless it's a King-Pawn fork.
             // If valid target check:
             const isKing = pos.board.king.has(targetSq);
             const isQueen = pos.board.queen.has(targetSq);
             const isRook = pos.board.rook.has(targetSq);
             
             if (isKing || isQueen || isRook) {
                 targets.push(targetSq);
             }
          }
      }
  }

  // Double Attack check
  if (targets.length >= 2) {
      // Create pattern
      const targetNames = targets.map(sq => {
          if (pos.board.king.has(sq)) return "King";
          if (pos.board.queen.has(sq)) return "Queen";
          if (pos.board.rook.has(sq)) return "Rook";
          return "Piece";
      });
      
      patterns.push({
          theme: "Fork",
          squares: [getSquareName(movedSquare), ...targets.map(t => getSquareName(t))], 
          description: `Fork on ${targetNames.join(" and ")}`
      });
  }

  return patterns;
}
