import { Position, Square, Side, getSquareName, getOppositeSide, SquareSet, getPieces } from "../core";
import { TacticalPattern } from "../types";
import { ray, bishopAttacks, rookAttacks } from "chessops/attacks";

export function detectDiscoveredAttacks(
  pos: Position,
  fromSquare: Square,
  side: Side,
  movedPieceRole: string
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const opponent = getOppositeSide(side);
  
  // Wait, getPieces(pos, side) is better to filter by side first
  const ourPieces = getPieces(pos, side);
  const ourQuiets = ourPieces.diff(SquareSet.fromSquare(fromSquare)); // The piece that moved is NOT the discoverer

  // Potential targets
  const enemyPieces = getPieces(pos, opponent);
  const valuableTargets = enemyPieces.intersect(
      pos.board.king.union(pos.board.queen).union(pos.board.rook).union(pos.board.bishop).union(pos.board.knight)
  );

  const fromSqSet = SquareSet.fromSquare(fromSquare);
  const occupied = pos.board.occupied;

  // Check Bishops (and Queens acting as Bishops)
  const diagonalSliders = ourQuiets.intersect(pos.board.bishop.union(pos.board.queen));
  for (const sliderSq of diagonalSliders) {
      // Get all squares this bishop/queen ACTUALLY attacks now
      const attacks = bishopAttacks(sliderSq, occupied);
      
      // Intersect with enemy targets
      const hitTargets = attacks.intersect(valuableTargets);
      
      for (const targetSq of hitTargets) {
          // It attacks the target NOW. Was it a discovery?
          // Check if the ray between slider and target passed through 'fromSquare'
          const line = ray(sliderSq, targetSq);
          if (line.intersects(fromSqSet)) {
               // Yes, the moving piece was on the line!
               const isCheck = pos.board.king.has(targetSq);
               const sliderRole = pos.board.bishop.has(sliderSq) ? 'bishop' : 'queen';

               // Get target role
               let targetRole = 'pawn'; 
               if (pos.board.king.has(targetSq)) targetRole = 'king';
               else if (pos.board.queen.has(targetSq)) targetRole = 'queen';
               else if (pos.board.rook.has(targetSq)) targetRole = 'rook';
               else if (pos.board.bishop.has(targetSq)) targetRole = 'bishop';
               else if (pos.board.knight.has(targetSq)) targetRole = 'knight';

               patterns.push({
                  theme: isCheck ? "DiscoveredCheck" : "DiscoveredAttack",
                  squares: [getSquareName(fromSquare), getSquareName(sliderSq), getSquareName(targetSq)],
                  pieces: [movedPieceRole, sliderRole, targetRole],
                  description: isCheck 
                    ? `Discovered Check from ${getSquareName(sliderSq)}`
                    : `Discovered Attack on ${getSquareName(targetSq)}`
              });
          }
      }
  }

  // Check Rooks (and Queens acting as Rooks)
  const orthogonalSliders = ourQuiets.intersect(pos.board.rook.union(pos.board.queen));
  for (const sliderSq of orthogonalSliders) {
       // Get all squares this rook/queen ACTUALLY attacks now
      const attacks = rookAttacks(sliderSq, occupied);
      
      // Intersect with enemy targets
      const hitTargets = attacks.intersect(valuableTargets);
      
      for (const targetSq of hitTargets) {
          // It attacks the target NOW. Was it a discovery?
          // Check if the ray between slider and target passed through 'fromSquare'
          const line = ray(sliderSq, targetSq);
          if (line.intersects(fromSqSet)) {
               // Yes, the moving piece was on the line!
               const isCheck = pos.board.king.has(targetSq);
               const sliderRole = pos.board.rook.has(sliderSq) ? 'rook' : 'queen';

               // Get target role
               let targetRole = 'pawn';
               if (pos.board.king.has(targetSq)) targetRole = 'king';
               else if (pos.board.queen.has(targetSq)) targetRole = 'queen';
               else if (pos.board.rook.has(targetSq)) targetRole = 'rook';
               else if (pos.board.bishop.has(targetSq)) targetRole = 'bishop';
               else if (pos.board.knight.has(targetSq)) targetRole = 'knight';

               patterns.push({
                  theme: isCheck ? "DiscoveredCheck" : "DiscoveredAttack",
                  squares: [getSquareName(fromSquare), getSquareName(sliderSq), getSquareName(targetSq)],
                  pieces: [movedPieceRole, sliderRole, targetRole],
                  description: isCheck 
                    ? `Discovered Check from ${getSquareName(sliderSq)}`
                    : `Discovered Attack on ${getSquareName(targetSq)}`
              });
          }
      }
  }

  return patterns;
}
