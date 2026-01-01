import { Position, Square, Side, getSquareName, getOppositeSide, getPieces } from "../core";
import { TacticalPattern } from "../types";
import { attacks } from "chessops/attacks";
import { getSquareValue } from "../material";


/**
 * Detects X-Ray attacks and defenses.
 * 
 * X-Ray: A piece attacks or defends a square through another piece.
 * Example: Rook on a1 X-rays a piece on a8 through a blocking piece on a5.
 * 
 * Uses "phantom occupied" mask: removes blocking pieces to reveal hidden attackers.
 */
export function detectXRayAttacks(
  pos: Position,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const opponent = getOppositeSide(side);
  
  // Get all friendly sliding pieces (potential X-ray attackers)
  const snipers = getPieces(pos, side).intersect(
    pos.board.bishop.union(pos.board.rook).union(pos.board.queen)
  );
  
  // Get high-value enemy targets (Queen, Rook, King)
  const valuableTargets = getPieces(pos, opponent).intersect(
    pos.board.queen.union(pos.board.rook).union(pos.board.king)
  );
  
  for (const sniperSq of snipers) {
    // Determine piece type for attack calculation
    const piece = pos.board.get(sniperSq);
    if (!piece) continue;
    
    // Direct attacks with normal occupied mask
    const directAttacks = attacks(piece, sniperSq, pos.board.occupied);
    
    // Create phantom occupied: remove enemy sliding pieces that could be blocking
    const enemySlidingPieces = getPieces(pos, opponent).intersect(
      pos.board.bishop.union(pos.board.rook).union(pos.board.queen)
    );
    const phantomOccupied = pos.board.occupied.diff(enemySlidingPieces);
    
    // X-Ray attacks with phantom occupied
    const xrayAttacks = attacks(piece, sniperSq, phantomOccupied);
    
    // Find new targets visible only through X-ray
    const xrayOnlyTargets = xrayAttacks.intersect(valuableTargets).diff(directAttacks);
    
    for (const targetSq of xrayOnlyTargets) {
      // Find the blocking piece(s) between sniper and target
      const xrayPath = attacks(piece, sniperSq, phantomOccupied);
      
      // The blocker is on the X-ray path but blocks the direct path
      const blockingPieces = xrayPath.diff(directAttacks).intersect(pos.board.occupied);
      
      if (blockingPieces.size() > 0) {
        const blockerSq = blockingPieces.first();
        if (blockerSq === undefined) continue;
        
        // Get piece names
        const sniperRole = getRoleName(pos, sniperSq);
        const targetRole = getRoleName(pos, targetSq);
        const blockerRole = getRoleName(pos, blockerSq);
        
        const gain = getSquareValue(pos, targetSq);

        patterns.push({
          theme: 'XRay',
          squares: [getSquareName(sniperSq), getSquareName(blockerSq), getSquareName(targetSq)],
          pieces: [sniperRole, blockerRole, targetRole],
          gain,
          description: `X-Ray: ${sniperRole} attacks ${targetRole} through ${blockerRole}`
        });
      }
    }
  }
  
  return patterns;
}

/**
 * Detects X-Ray defenses (piece defends through another piece).
 * 
 * Example: Rook on a1 X-ray defends a piece on a5 through blocking piece on a3.
 */
export function detectXRayDefenses(
  pos: Position,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const opponent = getOppositeSide(side);
  
  // Get friendly pieces that could be defended
  const friendlyPieces = getPieces(pos, side);
  
  // Get friendly sliding pieces (potential X-ray defenders)
  const defenders = friendlyPieces.intersect(
    pos.board.bishop.union(pos.board.rook).union(pos.board.queen)
  );
  
  for (const defenderSq of defenders) {
    // Determine piece type
    const piece = pos.board.get(defenderSq);
    if (!piece) continue;
    
    // Direct defense coverage
    const directCoverage = attacks(piece, defenderSq, pos.board.occupied);
    
    // X-Ray coverage (remove friendly pieces that might be blocking)
    const phantomOccupied = pos.board.occupied.diff(friendlyPieces);
    const xrayCoverage = attacks(piece, defenderSq, phantomOccupied);
    
    // Find pieces only defended through X-ray
    const xrayDefendedPieces = xrayCoverage.intersect(friendlyPieces).diff(directCoverage);
    
    for (const defendedSq of xrayDefendedPieces) {
      // Only report if the defended piece is under attack
      let hasAttacker = false;
      for (const enemySq of getPieces(pos, opponent)) {
        const enemyPiece = pos.board.get(enemySq);
        if (!enemyPiece) continue;
        
        if (attacks(enemyPiece, enemySq, pos.board.occupied).has(defendedSq)) {
          hasAttacker = true;
          break;
        }
      }
      
      if (hasAttacker) {
        const defenderRole = getRoleName(pos, defenderSq);
        const defendedRole = getRoleName(pos, defendedSq);
        
        patterns.push({
          theme: 'XRayDefense',
          squares: [getSquareName(defenderSq), getSquareName(defendedSq)],
          pieces: [defenderRole, defendedRole],
          description: `X-Ray Defense: ${defenderRole} indirectly defends ${defendedRole}`
        });
      }
    }
  }
  
  return patterns;
}

/**
 * Helper: Get piece role name from square
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
