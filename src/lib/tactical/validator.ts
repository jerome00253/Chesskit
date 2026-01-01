import { TacticalPattern } from "./types";
import { Side } from "./core";

export interface PatternValidationResult {
  pattern: TacticalPattern;
  isValid: boolean;
  isFalseAttack: boolean;
  evalDelta: number;
}

/**
 * Validates a tactical pattern against Stockfish evaluation.
 * Detects "False Attacks" where a pattern exists but leads to a worse position.
 * 
 * Logic:
 * 1. If evaluation improves or stays roughly equal, the tactic is valid.
 * 2. If evaluation drops significantly, it might be a false attack (blunder).
 */
export function validatePattern(
  pattern: TacticalPattern,
  evalBefore: number,
  evalAfter: number,
  side: Side
): PatternValidationResult {
  // Calculate evaluation delta from the perspective of the side moving
  // Note: Engines usually give evaluation from White's perspective, or side-to-move.
  // We assume eval is signed relative to White (positive = White winning).
  
  const evalDeltaRaw = evalAfter - evalBefore;
  const evalDelta = side === 'white' ? evalDeltaRaw : -evalDeltaRaw;
  
  // Thresholds
  const BLUNDER_THRESHOLD = -1.5; // Significant loss
  
  // Is this a false attack?
  // Condition: The pattern claims a gain (e.g. Fork), but the evaluation drops.
  const isPositivePattern = (pattern.gain || 0) > 0;
  
  let isValid = true;
  let isFalseAttack = false;
  
  if (isPositivePattern && evalDelta < BLUNDER_THRESHOLD) {
    isValid = false;
    isFalseAttack = true;
  }
  
  // Specific check: Hanging pieces (Blunders)
  // If we detect a hanging piece (our own), isValid is true if eval matches the loss.
  if (pattern.theme === 'HangingPiece') {
      // Logic handled by Priority System usually, but here we can confirm the blunder.
      // If eval drops, the "Hanging Piece" detection is confirmed as relevant.
  }

  return {
    pattern,
    isValid,
    isFalseAttack,
    evalDelta
  };
}
