import { Position, Square, Side, getSquareName, getOppositeSide, getPieces, getAttackers } from "../core";
import { TacticalPattern } from "../types";
import { between } from "chessops/attacks";

/**
 * Detects pins created by the move.
 * Uses strict ray intersection logic to identify pieces blocked from moving.
 */
export function detectPins(
  pos: Position,
  _movedSquare: Square,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const opponent = getOppositeSide(side);
  
  // 1. Identification: Pins are caused by our "Sliders" (Rook, Bishop, Queen)
  const ourSliders = getPieces(pos, side).intersect(
    pos.board.bishop.union(pos.board.rook).union(pos.board.queen)
  );
  
  // 2. Targets: Valuable enemy pieces (King, Queen, Rook)
  const enemyPieces = getPieces(pos, opponent);
  // Prioritize King, then Queen, then Rook/Bishop as targets of a pin/skewer
  const valuableEnemies = enemyPieces.intersect(
      pos.board.king.union(pos.board.queen).union(pos.board.rook)
  );

  for (const sliderSq of ourSliders) {
       // Filter: If the pinning piece is hanging (attacked and undefended), ignore it
       const attackers = getAttackers(pos, sliderSq, opponent);
       if (attackers.size() > 0) {
           const defenders = getAttackers(pos, sliderSq, side);
           if (defenders.size() === 0) {
               // En prise! Skip reporting this pin as it's likely a blunder noise
               continue;
           }
       }

       for (const targetSq of valuableEnemies) {
           // Get the line connecting slider and target
           // ray() returns the full line (infinite). We need the segment.
           // chessops provides 'between' lookup for this exact purpose.
           const segment = between(sliderSq, targetSq);
           
           // If they are not aligned (or same square), segment is empty
           // (Note: between returns empty if not aligned diagonal/orthogonal)
           // But wait: if sliderSq and targetSq are adjacent, between is empty too.
           // In that case valid Pin is impossible (no space for blocker).
           if (segment.isEmpty()) continue;
           
           // Calculate blockers: Squares strictly between slider and target
           const blockers = segment.intersect(pos.board.occupied);

           // A Pin (or Skewer) occurs when there is exactly ONE piece blocking the attack
           
           // A Pin (or Skewer) occurs when there is exactly ONE piece blocking the attack
           if (blockers.size() === 1) {
               const blockerSq = blockers.singleSquare();
               if (blockerSq === undefined) continue;

               // Distinguish Pin vs Skewer based on ownership
               // If blocker is ENEMY -> PIN (blocker cannot move freely)
               // If blocker is FRIEND -> Discovered Attack Battery (handled elsewhere)
               
               if (enemyPieces.has(blockerSq)) {
                   const isKing = pos.board.king.has(targetSq);
                   
                   // Helper to get role safely
                   const getRole = (s: number) => {
                       if (pos.board.pawn.has(s)) return 'pawn';
                       if (pos.board.knight.has(s)) return 'knight';
                       if (pos.board.bishop.has(s)) return 'bishop';
                       if (pos.board.rook.has(s)) return 'rook';
                       if (pos.board.queen.has(s)) return 'queen';
                       if (pos.board.king.has(s)) return 'king';
                       return 'piece';
                   };

                   const sliderRole = getRole(sliderSq);
                   const blockerRole = getRole(blockerSq);
                   const targetRole = getRole(targetSq);

                   if (isKing) {
                       // Absolute Pin
                       patterns.push({
                           theme: "Pin", 
                           squares: [getSquareName(sliderSq), getSquareName(blockerSq), getSquareName(targetSq)],
                           pieces: [sliderRole, blockerRole, targetRole],
                           description: `Absolute Pin on ${getSquareName(blockerSq)}`
                       });
                   } else {
                       // Relative Pin or Skewer
                       patterns.push({
                           theme: "Pin", 
                           squares: [getSquareName(sliderSq), getSquareName(blockerSq), getSquareName(targetSq)],
                           pieces: [sliderRole, blockerRole, targetRole],
                           description: `Pin against ${getSquareName(targetSq)}`
                       });
                   }
               }
           }
       }
  }

  return patterns;
}
