import { Position, Square, Side, getSquareName, getOppositeSide, SquareSet } from "../core";
import { TacticalPattern } from "../types";
import { ray } from "chessops/attacks";

/**
 * Detects pins and skewers.
 * Pin: A piece is "pinned" if moving it would expose a more valuable piece (King/Queen) to attack.
 * Skewer: A valuable piece is attacked and forced to move, exposing a piece behind it.
 * 
 * We primarily check if the move CREATED a pin (attacking pin) on an opponent piece.
 */
export function detectPins(
  pos: Position,
  _movedSquare: Square, // Unused but kept for signature consistency (prefixed with _)
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const opponent = getOppositeSide(side);
  
  // We check rays from our own sliders that might be penetrating enemy lines.
  // Actually, efficient pin detection:
  // For each enemy piece (potential pin target):
  // Check if it is on a ray between a friendly slider and an enemy valuable piece (King/Queen).
  
  const ourSliders = pos.board[side].intersect(
    pos.board.bishop.union(pos.board.rook).union(pos.board.queen)
  );
  
  const enemies = pos.board[opponent];
  const enemyKing = pos.board.king.intersect(enemies); // Should be one square
  const enemyValuables = pos.board.queen.union(pos.board.rook).union(enemyKing);

  // Optimization: Only check sliders that align with the moved piece?
  // No, the moved piece itself might be the pinner.
  // Or the moved piece might have unblocked a line (Discovered Attack cover this).
  // Here we focus on: Did the moved piece BECOME a pinner? 
  // We iterate our sliders and check for pins.
  
  // console.log("Detecting pins for", side, "Sliders:", Array.from(ourSliders).map(getSquareName));

  for (const sliderSq of ourSliders) {
       // console.log("Checking slider:", getSquareName(sliderSq));
       // Check rays from slider
       // Identifying pins is tricky with just bitboards without a "ray" lookup between squares.
       // chessops offers 'ray(sq1, sq2)' which returns the line between two squares if they share a ray.
       
       for (const valuableSq of enemyValuables) {
           const line = ray(sliderSq, valuableSq);
           if (line.isEmpty()) continue; // Not aligned
           
           // Check occupancy on the line (excluding start/end)
           const between = line.diff(SquareSet.fromSquare(sliderSq)).diff(SquareSet.fromSquare(valuableSq));
           const blockers = between.intersect(pos.board.occupied);
           
           // console.log("Line:", getSquareName(sliderSq), "-", getSquareName(valuableSq), "Blockers:", blockers.size());
           
           if (blockers.size() === 1) {
               // Exact ONE blocker. This is a PIN or Skewer.
               const blockerSq = blockers.singleSquare(); 
                if (blockerSq === undefined) continue; // Should not happen if size is 1

               // Is the blocker an enemy?
               if (enemies.has(blockerSq)) {
                   // ABSOLUTE PIN if target is King
                   if (pos.board.king.has(valuableSq)) {
                       patterns.push({
                           theme: "Pin",
                           squares: [getSquareName(blockerSq), getSquareName(valuableSq)], 
                           description: `Pin on ${getSquareName(blockerSq)} to the King`
                       });
                   } 
                   // RELATIVE PIN / SKEWER
                   else {
                       // If blocker value < target value -> Pin
                       // If blocker value > target value -> Skewer (usually)
                       // Simple heuristic:
                       patterns.push({
                           theme: "Pin", 
                           squares: [getSquareName(blockerSq), getSquareName(valuableSq)],
                           description: `Pin/Skewer against ${getSquareName(valuableSq)}`
                       });
                   }
               }
           }
       }
  }

  return patterns;
}
