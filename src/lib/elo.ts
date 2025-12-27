/**
 * Elo rating calculation utilities
 *
 * Standard Elo formula:
 * - Expected score: E = 1 / (1 + 10^((opponentRating - playerRating) / 400))
 * - New rating: R' = R + K * (S - E)
 *   where S = actual score (1 for win, 0.5 for draw, 0 for loss)
 *         K = rating change multiplier (higher = more volatile)
 */

/**
 * Calculate expected score based on rating difference
 */
function getExpectedScore(
  playerRating: number,
  opponentRating: number
): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Determine K-factor based on player rating and number of games
 * - New players (< 30 games or rating < 2100): K = 32
 * - Established players: K = 16
 * - Masters (2400+): K = 10
 */
function getKFactor(playerRating: number, gamesPlayed: number): number {
  if (gamesPlayed < 30 || playerRating < 2100) {
    return 32;
  } else if (playerRating >= 2400) {
    return 10;
  } else {
    return 16;
  }
}

export interface RatingUpdateParams {
  currentRating: number;
  opponentRating: number;
  result: "win" | "draw" | "loss";
  gamesPlayed?: number; // For K-factor calculation
}

/**
 * Calculate new Elo rating after a game
 *
 * @param params - Rating update parameters
 * @returns New rating (rounded to nearest integer)
 */
export function calculateNewRating(params: RatingUpdateParams): number {
  const { currentRating, opponentRating, result, gamesPlayed = 0 } = params;

  // Convert result to score
  const actualScore = result === "win" ? 1 : result === "draw" ? 0.5 : 0;

  // Calculate expected score
  const expectedScore = getExpectedScore(currentRating, opponentRating);

  // Determine K-factor
  const kFactor = getKFactor(currentRating, gamesPlayed);

  // Calculate rating change
  const ratingChange = kFactor * (actualScore - expectedScore);

  // Return new rating (minimum 100, to avoid negative ratings)
  return Math.max(100, Math.round(currentRating + ratingChange));
}

/**
 * Determine game result from user's perspective
 *
 * @param gameResult - PGN result string (e.g., "1-0", "0-1", "1/2-1/2")
 * @param userColor - User's color ("white" or "black")
 * @returns Result from user's perspective
 */
export function getUserGameResult(
  gameResult: string,
  userColor: "white" | "black"
): "win" | "draw" | "loss" | null {
  if (gameResult === "1/2-1/2") return "draw";

  if (gameResult === "1-0") {
    return userColor === "white" ? "win" : "loss";
  }

  if (gameResult === "0-1") {
    return userColor === "black" ? "win" : "loss";
  }

  return null; // Game not finished or invalid result
}

/**
 * Estimate opponent rating from game data
 * If opponent rating is not available, estimate based on analysis or use default
 */
export function estimateOpponentRating(
  opponentRatingFromPGN?: number | null,
  gameAccuracy?: number,
  defaultRating: number = 1200
): number {
  // If we have the actual rating, use it
  if (opponentRatingFromPGN) {
    return opponentRatingFromPGN;
  }

  // Estimate based on accuracy if available
  // Rough mapping: 90%+ accuracy ≈ 1800+, 80-90% ≈ 1500-1800, etc.
  if (gameAccuracy !== undefined && gameAccuracy !== null) {
    if (gameAccuracy >= 90) return 1800;
    if (gameAccuracy >= 80) return 1600;
    if (gameAccuracy >= 70) return 1400;
    if (gameAccuracy >= 60) return 1200;
    return 1000;
  }

  // Fallback to default
  return defaultRating;
}
