import { Position, Side, getOppositeSide, getSquareName, getAttackers, getPieces, getPieceValue } from "../core";
import { TacticalPattern } from "../types";
import { addPiecesToPattern } from "../pieceHelper";

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
          // Determine piece role for i18n
      let roleName = "piece";
      if (pos.board.pawn.has(sq)) roleName = "pawn";
      else if (pos.board.knight.has(sq)) roleName = "knight";
      else if (pos.board.bishop.has(sq)) roleName = "bishop";
      else if (pos.board.rook.has(sq)) roleName = "rook";
      else if (pos.board.queen.has(sq)) roleName = "queen";
      else if (pos.board.king.has(sq)) roleName = "king";
      
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
