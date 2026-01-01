import { Position, Square, Side, getSquareName, getOppositeSide, getPieces, getAttackers } from "../core";
import { TacticalPattern } from "../types";
import { ray } from "chessops/attacks";

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

/**
 * Detects ABSOLUTE PINS (pieces pinned to the King).
 * Uses chessops' built-in pos.pinned bitboard for maximum reliability.
 */
export function detectAbsolutePins(
  pos: Position,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const opponent = getOppositeSide(side);
  
  // pos.pinned is only available on Chess instances, not all Position types
  // Type guard: check if pinned is available
  if (!('pinned' in pos)) {
    return patterns; // Fallback for positions without pinned property
  }
  
  // Pièces adverses clouées au Roi
  const enemyPieces = getPieces(pos, opponent);
  const pinnedToKing = (pos as any).pinned.intersect(enemyPieces);
  
  for (const pinnedSq of pinnedToKing) {
    // Trouver le Roi adverse
    const kingSq = pos.board.king.intersect(pos.board[opponent]).first();
    if (kingSq === undefined) continue;
    
    // Chercher le "sniper" qui crée le clouage sur le rayon
    const rayToKing = ray(pinnedSq, kingSq);
    const snipers = rayToKing.intersect(getPieces(pos, side)).intersect(
      pos.board.bishop.union(pos.board.rook).union(pos.board.queen)
    );
    
    const sniperSq = snipers.first();
    if (sniperSq === undefined) continue;
    
    // Vérifier que le sniper n'est pas en prise (filtre le bruit)
    const attackers = getAttackers(pos, sniperSq, opponent);
    if (attackers.size() > 0) {
      const defenders = getAttackers(pos, sniperSq, side);
      if (defenders.isEmpty()) {
        continue; // Sniper en prise, skip
      }
    }
    
    patterns.push({
      theme: 'AbsolutePin',
      squares: [getSquareName(sniperSq), getSquareName(pinnedSq), getSquareName(kingSq)],
      pieces: [getRoleName(pos, sniperSq), getRoleName(pos, pinnedSq), 'king'],
      description: `Absolute Pin: ${getRoleName(pos, pinnedSq)} cannot move`
    });
  }
  
  return patterns;
}

/**
 * Detects RELATIVE PINS (pieces pinned to a Queen or Rook).
 * Uses ray() to find pieces on the same line as a high-value target.
 */
export function detectRelativePins(
  pos: Position,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const opponent = getOppositeSide(side);
  
  const enemyPieces = getPieces(pos, opponent);
  
  // Grosses pièces adverses (Dame, Tour)
  const bigPieces = enemyPieces.intersect(
    pos.board.queen.union(pos.board.rook)
  );
  
  // Snipers amis (Fou, Tour, Dame)
  const snipers = getPieces(pos, side).intersect(
    pos.board.bishop.union(pos.board.rook).union(pos.board.queen)
  );
  
  for (const sniperSq of snipers) {
    // Filtre : sniper en prise = bruit
    const attackers = getAttackers(pos, sniperSq, opponent);
    if (attackers.size() > 0) {
      const defenders = getAttackers(pos, sniperSq, side);
      if (defenders.isEmpty()) {
        continue;
      }
    }
    
    for (const bigTarget of bigPieces) {
      const fullRay = ray(sniperSq, bigTarget);
      
      // Pièces sur le rayon (incluant sniper et cible)
      const onRay = fullRay.intersect(pos.board.occupied);
      
      // Clouage relatif = exactement 3 pièces (sniper + blocker + cible)
      if (onRay.size() === 3) {
        // Trouver le bloqueur (ni sniper ni cible)
        const blockerCandidates = onRay.without(sniperSq).without(bigTarget);
        const blockerSq = blockerCandidates.first();
        
        if (blockerSq !== undefined && enemyPieces.has(blockerSq)) {
          patterns.push({
            theme: 'RelativePin',
            squares: [getSquareName(sniperSq), getSquareName(blockerSq), getSquareName(bigTarget)],
            pieces: [getRoleName(pos, sniperSq), getRoleName(pos, blockerSq), getRoleName(pos, bigTarget)],
            description: `Relative Pin: ${getRoleName(pos, blockerSq)} shields ${getRoleName(pos, bigTarget)}`
          });
        }
      }
    }
  }
  
  return patterns;
}

/**
 * Detects UNPINNING (pieces that were pinned but are no longer).
 * Compares pos before and after the move.
 */
export function detectUnpinning(
  posBefore: Position,
  posAfter: Position,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  
  // Check if positions have pinned property (Chess instances only)
  if (!('pinned' in posBefore) || !('pinned' in posAfter)) {
    return patterns;
  }
  
  // Pièces qui ÉTAIENT clouées mais ne le sont PLUS
  const unpinnedPieces = (posBefore as any).pinned.diff((posAfter as any).pinned);
  
  for (const sq of unpinnedPieces) {
    // Vérifier si la pièce existe encore (pas capturée) et appartient au bon joueur
    const piece = posAfter.board.get(sq);
    if (piece && piece.color === side) {
      patterns.push({
        theme: 'Unpinning',
        squares: [getSquareName(sq)],
        pieces: [getRoleName(posAfter, sq)],
        description: `${getRoleName(posAfter, sq)} is no longer pinned`
      });
    }
  }
  
  return patterns;
}
