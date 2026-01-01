import { Position, Side, getOppositeSide, getSquareName, getAttackers, getPieces, getPieceValue, Square } from "../core";
import { TacticalPattern } from "../types";
import { addPiecesToPattern } from "../pieceHelper";

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
 * Detects pieces that are "Hanging" (undefended and attacked).
 */
export function detectHangingPieces(
  pos: Position,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const pieces = getPieces(pos, side);
  const opponent = getOppositeSide(side);
  
  for (const sq of pieces) {
      if (pos.board.king.has(sq)) continue; 
      
      const attackers = getAttackers(pos, sq, opponent);
      if (attackers.isEmpty()) continue;
      
      // Defended?
      // "Defenders" are essentially "Attackers" from our own side
      const defenders = getAttackers(pos, sq, side);
      
      if (defenders.isEmpty()) {
          const roleName = getRoleName(pos, sq);
      
          // CRITICAL: Filter out "Fake Hanging" pieces (Bad Trades).
          // If a low value piece (Pawn) is undefended but attacked by a high value piece (Queen),
          // it is technically hanging, but capturing it is a blunder for the attacker.
          // We only report it if the exchange is favorable or equal for an attacker.
          
          const targetValue = getPieceValue(roleName);
          let allAttackersAreBadTrades = true;
          
          for (const attackerSq of attackers) {
              const attackerPiece = pos.board.get(attackerSq);
              if (attackerPiece) {
                  const attackerValue = getPieceValue(attackerPiece.role);
                  // If just ONE attacker can take continuously (Value <= Target), it's a valid threat.
                  // If Attacker > Target (e.g. Queen vs Pawn), it's a bad trade, unless checkmate (handled elsewhere).
                  // We accept Attacker <= Target + 1 (allows for minor material sacrifices or equal trades).
                  if (attackerValue <= targetValue) {
                      allAttackersAreBadTrades = false;
                      break;
                  }
              }
          }
          
          // Special Exception: If the King is "hanging" (Check), we always report it (handled by Check pattern, but safety check might overlap).
          // Actually hanging king is impossible in chess (it's Check).
          // But if we are checking "hanging pieces", King might be in the list?
          // No, we filtered King at start of loop: `if (pos.board.king.has(sq)) continue;`
          
          // So if ALL attackers are bad trades (e.g. Queen attacking Pawn), we ignore this "hanging" piece.
          if (allAttackersAreBadTrades) {
               continue;
          }
          
      patterns.push({
        theme: 'HangingPiece',
        squares: [getSquareName(sq)],
        pieces: [roleName],
        description: `Hanging ${roleName} on ${getSquareName(sq)}`
      });
      }
  }
  return patterns;
}

/**
 * Detects Overloaded defenders.
 * A piece is overloaded if it is the ONLY defender of two or more *attacked* pieces.
 */
export function detectOverloadedDefenders(
  pos: Position,
  side: Side
): TacticalPattern[] {
    const patterns: TacticalPattern[] = [];
    const pieces = getPieces(pos, side);
    const opponent = getOppositeSide(side);

    // Map: DefenderSquare -> List of Squares it is solely defending
    const defenderLoad = new Map<number, number[]>();

    for (const sq of pieces) {
        if (pos.board.king.has(sq)) continue;
        
        // It must be under threat to "require" defense
        const attackers = getAttackers(pos, sq, opponent);
        if (attackers.isEmpty()) continue;

        const defenders = getAttackers(pos, sq, side);
        
        if (defenders.size() === 1) {
            const defenderSq = defenders.singleSquare(); // It's a SquareSet
            if (defenderSq !== undefined) {
                const currentLoad = defenderLoad.get(defenderSq) || [];
                currentLoad.push(sq);
                defenderLoad.set(defenderSq, currentLoad);
            }
        }
    }

    // Check for overload
    for (const [defenderSq, defendedSqs] of defenderLoad.entries()) {
        if (defendedSqs.length >= 2) {
            patterns.push({
                theme: "Overloaded",
                squares: [getSquareName(defenderSq), ...defendedSqs.map(getSquareName)],
                pieces: addPiecesToPattern(pos, [defenderSq, ...defendedSqs]),
                description: `Overloaded Defender on ${getSquareName(defenderSq)}`
            });
        }
    }

    return patterns;
}

/**
 * Detects pieces that are UNDERDEFENDED (more attackers than defenders).
 * LOGIQUE 2: Pièce sous-protégée
 */
export function detectUnderdefendedPieces(
  pos: Position,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const pieces = getPieces(pos, side);
  const opponent = getOppositeSide(side);
  
  for (const sq of pieces) {
    if (pos.board.king.has(sq)) continue;
    
    const attackers = getAttackers(pos, sq, opponent);
    const defenders = getAttackers(pos, sq, side);
    
    // Skip if not attacked
    if (attackers.isEmpty()) continue;
    
    // Skip if already hanging (covered by detectHangingPieces)
    if (defenders.isEmpty()) continue;
    
    // LOGIQUE 2: More attackers than defenders
    if (attackers.size() > defenders.size()) {
      const roleName = getRoleName(pos, sq);
      
      patterns.push({
        theme: 'Underdefended',
        squares: [getSquareName(sq)],
        pieces: [roleName],
        attackerCount: attackers.size(),
        defenderCount: defenders.size()
      } as any); // Cast to bypass strict type check for extra fields
    }
  }
  
  return patterns;
}

/**
 * Detects pieces attacked by LESSER VALUE pieces.
 * LOGIQUE 3: Menace par pièce de moindre valeur
 */
export function detectAttackedByLesser(
  pos: Position,
  side: Side
): TacticalPattern[] {
  const patterns: TacticalPattern[] = [];
  const pieces = getPieces(pos, side);
  const opponent = getOppositeSide(side);
  
  for (const sq of pieces) {
    if (pos.board.king.has(sq)) continue;
    
    const targetRole = getRoleName(pos, sq);
    const targetValue = getPieceValue(targetRole);
    
    // Skip low-value pieces (Pawn/Knight/Bishop)
    // Only report for high-value pieces (Rook/Queen)
    if (targetValue < 5) continue;
    
    const attackers = getAttackers(pos, sq, opponent);
    
    for (const attackerSq of attackers) {
      const attackerRole = getRoleName(pos, attackerSq);
      const attackerValue = getPieceValue(attackerRole);
      
      // LOGIQUE 3: Attacker has lower value than target
      // Minimum difference of 2 to avoid noise (e.g., Rook vs Knight = acceptable)
      if (attackerValue < targetValue && (targetValue - attackerValue) >= 2) {
        patterns.push({
          theme: 'AttackedByLesser',
          squares: [getSquareName(sq), getSquareName(attackerSq)],
          pieces: [targetRole, attackerRole],
          valueDiff: targetValue - attackerValue
        } as any);
        break; // Only report once per target piece
      }
    }
  }
  
  return patterns;
}
