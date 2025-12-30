import { Position, Square, Side, SquareSet, getOppositeSide, getSquareName, getPieces, getAttackers, getPieceValue } from "../core";
import { TacticalPattern } from "../types";
import { addPiecesToPattern } from "../pieceHelper";
import { between } from "chessops/attacks";

/**
 * Detects Interference:
 * The moved piece lands on a line between two enemy pieces (or an enemy piece and a critical square),
 * breaking their connection/coordination.
 */
export function detectInterference(
  pos: Position,
  movedSquare: Square,
  side: Side
): TacticalPattern[] {
  const opponent = getOppositeSide(side);
  
  // Enemy sliders that could be disconnected
  const enemySliders = getPieces(pos, opponent).intersect(
      pos.board.bishop.union(pos.board.rook).union(pos.board.queen)
  );

  // Enemy targets (pieces that might get disconnected from defense)
  // We check connections between Slider -> Any Enemy Piece
  const enemyPieces = getPieces(pos, opponent);

  const validPatterns: TacticalPattern[] = [];

  for (const sliderSq of enemySliders) {
      for (const targetSq of enemyPieces) {
          if (sliderSq === targetSq) continue;

          // Check if there is a line between them
          // We use strictly the segment between them.
          const segment = between(sliderSq, targetSq);
          
          if (segment.isEmpty()) continue; // Not aligned or adjacent

          // CRITICAL: Check if the piece can actually move along this line.
          // ray/between checks geometry (rank/file/diagonal) but not piece capabilities.
          // Bishop at a4 cannot interfere on rank a4-h4.
          const sliderRole = pos.board.get(sliderSq)?.role;

          // If role is missing or not a slider, skip.
          if (!sliderRole || (sliderRole !== 'bishop' && sliderRole !== 'rook' && sliderRole !== 'queen')) {
              continue;
          }
          
          if (sliderRole === 'bishop') {
             // Must be diagonal
             const file1 = sliderSq & 7;
             const rank1 = sliderSq >> 3;
             const file2 = targetSq & 7;
             const rank2 = targetSq >> 3;
             if (Math.abs(file1 - file2) !== Math.abs(rank1 - rank2)) {
                 continue; // Not a diagonal, Bishop cannot attack
             }
          } else if (sliderRole === 'rook') {
             // Must be orthogonal (Same rank OR Same file)
             const file1 = sliderSq & 7;
             const rank1 = sliderSq >> 3;
             const file2 = targetSq & 7;
             const rank2 = targetSq >> 3;
             if (file1 !== file2 && rank1 !== rank2) {
                 continue; // Not orthogonal, Rook cannot attack
             }
          }
          // Queen can do both.

          // Check if the moved piece is strictly between them
          if (segment.has(movedSquare)) {
              // The moved piece is interposing!
              
              // CRITICAL: An interference is only tactically relevant if the target (that loses defense)
              // is actually under attack/pressure by US (the side moving).
              // Otherwise, we are just blocking a random line.
              if (getAttackers(pos, targetSq, side).isEmpty()) {
                  continue; 
              }
              
              // Remove our moved piece from the blockers check to see 'previous' state validity
              // We check if the segment WAS clear before we moved there.
              // So execute intersect on occupied, but remove 'movedSquare' from it.
              const otherBlockers = segment.intersect(pos.board.occupied).diff(SquareSet.fromSquare(movedSquare));
              
              if (otherBlockers.isEmpty()) {
                  // We effectively broke a clear line of sight
                  validPatterns.push({
                      theme: "Interference",
                      squares: [getSquareName(movedSquare), getSquareName(sliderSq), getSquareName(targetSq)],
                      pieces: addPiecesToPattern(pos, [movedSquare, sliderSq, targetSq]),
                      description: `Interference between ${getSquareName(sliderSq)} and ${getSquareName(targetSq)}`
                  });
              }
          }
      }
  }

  // Sort patterns by value of the target piece (the one losing defense)
  // Higher value targets are more important to describe
  validPatterns.sort((a, b) => {
    // Extract target square from pattern (3rd element in squares/pieces)
    // We can't easily get square index back from name without helper, 
    // but we can trust the order we pushed: patterns are generated in loop.
    // Actually, `pieces` array in pattern has roles directly.
    // pieces[2] is the target role.
    
    const roleA = a.pieces?.[2] || 'pawn';
    const roleB = b.pieces?.[2] || 'pawn';
    
    return getPieceValue(roleB) - getPieceValue(roleA);
  });

  return validPatterns;
}
