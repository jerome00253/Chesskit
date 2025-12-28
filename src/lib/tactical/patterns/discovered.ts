import { Position, Square, Side, SquareSet, getOppositeSide, getSquareName, getPieces } from "../core";
import { TacticalPattern } from "../types";
import { ray } from "chessops/attacks";

export function detectDiscoveredAttacks(
  pos: Position,
  fromSquare: Square,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const opponent = getOppositeSide(side);
  
  const ourSliders = getPieces(pos, side).intersect(
    pos.board.bishop.union(pos.board.rook).union(pos.board.queen)
  );
  
  // Potential targets: King, Queen, Rook, Loose pieces
  const enemyTargets = getPieces(pos, opponent).intersect(
      pos.board.king.union(pos.board.queen).union(pos.board.rook).union(pos.board.bishop).union(pos.board.knight)
  );

  const fromSqSet = SquareSet.fromSquare(fromSquare);

  for (const sliderSq of ourSliders) {
      if (sliderSq === fromSquare) continue; // The slider itself didn't move (or if it did, it's not a discovery from itself typically)

      for (const targetSq of enemyTargets) {
          const line = ray(sliderSq, targetSq);
          
          // 1. Check if the FROM square lies on the ray
          if (line.intersect(fromSqSet).isEmpty()) continue;
          
          // 2. Check if the ray is NOW clear (in the current position)
          // The line includes the squares between slider and target.
          // In 'pos', fromSquare is empty (unless something else moved there, impossible in 1 move standard chess except castling logic complexity, but mostly fine).
          
          const between = line.diff(SquareSet.fromSquare(sliderSq)).diff(SquareSet.fromSquare(targetSq));
          const blockers = between.intersect(pos.board.occupied);
          
          if (blockers.isEmpty()) {
              // The path is clear now! It was blocked by 'fromSquare' previously (implied by step 1).
              // Discovered Attack!
              
              const isCheck = pos.board.king.has(targetSq);
              patterns.push({
                  theme: isCheck ? "DiscoveredCheck" : "DiscoveredAttack",
                  squares: [getSquareName(sliderSq), getSquareName(targetSq)],
                  description: isCheck 
                    ? `Discovered Check from ${getSquareName(sliderSq)}`
                    : `Discovered Attack on ${getSquareName(targetSq)}`
              });
          }
      }
  }

  return patterns;
}
