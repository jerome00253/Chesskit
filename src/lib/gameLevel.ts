/**
 * Game Level Logic
 * Calculates game level based on average Elo of players
 */

export type GameLevel =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Expert"
  | "Master";

/**
 * Calculate game level based on average Elo
 *
 * | Elo Moyen | Niveau       |
 * |-----------|--------------|
 * | < 1000    | Beginner     |
 * | 1000-1400 | Intermediate |
 * | 1400-1800 | Advanced     |
 * | 1800-2200 | Expert       |
 * | > 2200    | Master       |
 */
export function calculateGameLevel(
  whiteRating: number | null | undefined,
  blackRating: number | null | undefined
): GameLevel {
  // Default to 1200 if no rating
  const white = whiteRating || 1200;
  const black = blackRating || 1200;
  const avgElo = (white + black) / 2;

  if (avgElo < 1000) return "Beginner";
  if (avgElo < 1400) return "Intermediate";
  if (avgElo < 1800) return "Advanced";
  if (avgElo < 2200) return "Expert";
  return "Master";
}

/**
 * Get level color for UI display
 */
export function getLevelColor(level: GameLevel): string {
  switch (level) {
    case "Beginner":
      return "#4caf50"; // Green
    case "Intermediate":
      return "#2196f3"; // Blue
    case "Advanced":
      return "#9c27b0"; // Purple
    case "Expert":
      return "#ff9800"; // Orange
    case "Master":
      return "#f44336"; // Red
    default:
      return "#757575"; // Grey
  }
}

/**
 * Get level icon for UI display
 */
export function getLevelIcon(level: GameLevel): string {
  switch (level) {
    case "Beginner":
      return "mdi:chess-pawn";
    case "Intermediate":
      return "mdi:chess-knight";
    case "Advanced":
      return "mdi:chess-bishop";
    case "Expert":
      return "mdi:chess-rook";
    case "Master":
      return "mdi:chess-king";
    default:
      return "mdi:chess-pawn";
  }
}
