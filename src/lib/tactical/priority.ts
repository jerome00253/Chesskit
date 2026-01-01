import { TacticalPattern, TacticalTheme } from "./types";

/**
 * Priority levels for tactical patterns.
 * Higher number = Higher priority.
 */
export const PRIORITIES: Record<TacticalTheme | string, number> = {
  "Checkmate": 100,
  "Blunder": 90,        // Major mistake (e.g. hanging Queen)
  "HangingPiece": 85,   // Often a blunder if high value
  "Promotion": 80,
  "DoubleCheck": 75,
  "Check": 70,          // Forcing move
  "Fork": 60,           // Material gain
  "Skewer": 58,         // Material gain
  "DiscoveredAttack": 55,
  "DiscoveredCheck": 56,
  "Pin": 50,
  "AbsolutePin": 52,    // More restrictive than relative
  "RelativePin": 50,
  "Deflection": 45,
  "Decoy": 45,
  "Interference": 45,
  "XRay": 40,
  "XRayDefense": 35,
  "Overloaded": 30,
  "Underdefended": 25,
  "AttackedByLesser": 25,
  "Capture": 20,
  "Unpinning": 15,
  "Castling": 10,
  "MaterialLoss": 5,
  "InsufficientMaterial": 0,
  "Zugzwang": 5,
  "Stalemate": 50,
  "Brilliant": 95       // Special annotation
};

/**
 * Calculate the priority score for a given pattern.
 * Uses base priority + adjustments based on material gain.
 */
export function calculatePriority(pattern: TacticalPattern): number {
  const basePriority = PRIORITIES[pattern.theme] || 0;
  
  // Adjustment based on material gain
  // E.g. A Fork winning a Queen (9) is more important than a Fork winning a Pawn (1)
  const gainBonus = (pattern.gain || 0) * 2;
  
  // Special Context adjustments
  let contextBonus = 0;
  
  // Hanging Piece: If it's the King (Check/Mate), it should be top priority
  // Note: Usually "Hanging King" is detected as Check/Checkmate, but just in case
  if (pattern.theme === 'HangingPiece' && pattern.pieces?.includes('king')) {
    contextBonus += 1000;
  }

  // Checks that also win material (DiscoveredCheck) are very strong
  if (pattern.theme === 'DiscoveredCheck' && (pattern.gain || 0) > 0) {
    contextBonus += 10;
  }

  return basePriority + gainBonus + contextBonus;
}

/**
 * Sort patterns by priority (descending).
 */
export function sortPatternsByPriority(patterns: TacticalPattern[]): TacticalPattern[] {
  return [...patterns].sort((a, b) => {
    return calculatePriority(b) - calculatePriority(a);
  });
}
