import { Position, Square, Side, SquareSet, getOppositeSide, getSquareName, getAttackers } from "../core";
import { TacticalPattern } from "../types";
import { kingAttacks } from "chessops/attacks";

export function detectSafetyIssues(
  pos: Position,
  side: Side // The side to check safety for (usually the opponent of the mover)
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  
  // 1. Back Rank Weakness using Bitboards?
  // Definition: King is on rank 1/8. King is blocked by friendly pawns.
  // This is a "motif" rather than an immediate tactic unless there's a checkmate/threat.
  // We check if "Back Rank Mate" is threatened or happened.
  
  const kingSq = pos.board[side].intersect(pos.board.king).singleSquare();
  if (kingSq !== undefined) {
      // Check if King is on back rank
      const isWhite = side === "white";
      const backRank = isWhite ? 0 : 7; // Rank 0 or 7
      const rank = kingSq >> 3;
      
      if (rank === backRank) {
          // Check squares in front of king
          const forward = isWhite ? 8 : -8;
          const frontSquares = [kingSq + forward - 1, kingSq + forward, kingSq + forward + 1];
          // Filter valid board squares and check for friendly pawns
          // ... 
          // Actually, 'chessops' simplifies some attacks.
          // Let's stick to "Back Rank Mate" detection if checkmate happened.
          
          if (pos.isCheckmate()) {
             // If mate is delivered by a Rook/Queen on the back rank
             // pattern "BackRankMate"
             // How to confirm it is back rank?
             // King on back rank + attacker on back rank (horizontal) + King cannot move up?
             // This is complex to robustly define. 
             
             patterns.push({
                 theme: "Checkmate",
                 squares: [getSquareName(kingSq)],
                 description: "Checkmate"
             });
          }
      }
  }
  
  // 2. Hanging Pieces (En Prise)
  // Pieces attacked by opponent, but not defended by us.
  // OR Attacked by lower value piece (Pawn attacks Knight).
  
  const pieces = getPieces(pos, side);
  const opponent = getOppositeSide(side);
  
  for (const sq of pieces) {
      if (pos.board.king.has(sq)) continue; 
      
      const attackers = getAttackers(pos, sq, opponent);
      if (attackers.isEmpty()) continue;
      
      const defenders = getAttackers(pos, sq, side);
      
      // Case A: Hanging (0 defenders)
      if (defenders.isEmpty()) {
          // Only flag if it's a valuable piece or just created?
          // If we are analyzing the resulting position, checking ALL hanging pieces is noisy.
          // We usually care about the piece that just moved OR a piece that was just attacked.
          // For now, let's skip global hanging piece scan unless requested.
      }
  }

  return patterns;
}
