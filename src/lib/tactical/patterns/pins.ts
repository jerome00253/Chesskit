import { Position, Square, Side, getSquareName, getOppositeSide, getPieces, getAttackers } from "../core";
import { TacticalPattern } from "../types";
import { ray } from "chessops/attacks";

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
 * Helper: Get piece value for tactical comparison
 */
function getPieceValue(role: string): number {
  const values: Record<string, number> = {
    'pawn': 1,
    'knight': 3,
    'bishop': 3,
    'rook': 5,
    'queen': 9,
    'king': 100  // King has highest value
  };
  return values[role] || 0;
}

/**
 * Helper: Calculate Manhattan distance between two squares
 */
function distance(sq1: Square, sq2: Square): number {
  const file1 = sq1 & 7;
  const rank1 = sq1 >> 3;
  const file2 = sq2 & 7;
  const rank2 = sq2 >> 3;
  return Math.abs(file1 - file2) + Math.abs(rank1 - rank2);
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
 * Detects RELATIVE PINS (pieces pinned to Queen/Rook) and SKEWERS.
 * Uses ray() to find pieces on the same line as a high-value target.
 * 
 * Pin: Low value piece blocks attack to high value piece (front < back)
 * Skewer: High value piece forced to move, exposing low value piece (front > back)
 */
export function detectRelativePins(
  pos: Position,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const opponent = getOppositeSide(side);
  
  // Snipers amis (Fou, Tour, Dame)
  const snipers = getPieces(pos, side).intersect(
    pos.board.bishop.union(pos.board.rook).union(pos.board.queen)
  );
  
  // Grandes pièces ennemies (Dame, Tour)
  const bigPieces = getPieces(pos, opponent).intersect(
    pos.board.queen.union(pos.board.rook)
  );
  
  for (const sniperSq of snipers) {
    for (const bigTarget of bigPieces) {
      // Rayon complet du sniper vers la grosse pièce
      const fullRay = ray(sniperSq, bigTarget);
      
      // Toutes les pièces sur ce rayon
      const onRay = fullRay.intersect(pos.board.occupied);
      
      // On cherche exactement 3 pièces : Sniper + Blocker + Target
      if (onRay.size() === 3) {
        // Trier les pièces par distance au sniper
        const sorted = Array.from(onRay).sort((a, b) => 
          distance(sniperSq, a) - distance(sniperSq, b)
        );
        
        // sorted[0] = sniper, sorted[1] = blocker (milieu), sorted[2] = target (bout)
        const blockerSq = sorted[1];
        const targetSq = sorted[2];
        
        // Le blocker doit être ennemi
        const enemyPieces = getPieces(pos, opponent);
        if (!enemyPieces.has(blockerSq)) continue;
        
        // Comparer les valeurs pour déterminer Pin vs Skewer
        const blockerRole = getRoleName(pos, blockerSq);
        const targetRole = getRoleName(pos, targetSq);
        const blockerValue = getPieceValue(blockerRole);
        const targetValue = getPieceValue(targetRole);
        
        // Déterminer le type de pattern
        let theme: 'RelativePin' | 'Skewer';
        
        if (blockerValue < targetValue || targetRole === 'king') {
          // PIN: Pièce de faible valeur bloque, grosse pièce derrière
          theme = 'RelativePin';
        } else if (blockerValue > targetValue) {
          // SKEWER: Grosse pièce forcée de bouger, expose pièce derrière
          theme = 'Skewer';
        } else {
          // Valeurs égales, considérer comme Pin
          theme = 'RelativePin';
        }
        
        patterns.push({
          theme,
          squares: [getSquareName(sniperSq), getSquareName(blockerSq), getSquareName(targetSq)],
          pieces: [getRoleName(pos, sniperSq), blockerRole, targetRole],
          description: theme === 'Skewer' 
            ? `Skewer: ${blockerRole} must move, exposing ${targetRole}`
            : `Relative Pin: ${blockerRole} pinned to ${targetRole}`
        });
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
