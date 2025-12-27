import { Game } from "@/types/game";
import { subWeeks, subMonths, isSameYear } from "date-fns";

export type TimePeriod =
  | "week"
  | "month"
  | "6months"
  | "year"
  | "current_year"
  | "all";
export type GameSource = "all" | "chesscom" | "lichess" | "other";

export function filterGamesByPeriod(games: Game[], period: TimePeriod): Game[] {
  const now = new Date();

  return games.filter((game) => {
    if (!game.date) return false;

    // Handle Date object, ISO string, or YYYY.MM.DD format
    let gameDate: Date;
    if (typeof game.date === "object" && game.date instanceof Date) {
      gameDate = game.date;
    } else if (typeof game.date === "string") {
      // Check for YYYY.MM.DD format (contains dots but no hyphens/colons)
      if (game.date.includes(".") && !game.date.includes("-") && !game.date.includes(":")) {
        const parts = game.date.split(".");
        gameDate = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
      } else {
        // ISO format or other standard format
        gameDate = new Date(game.date);
      }
    } else {
      return false;
    }

    if (isNaN(gameDate.getTime())) return false;

    switch (period) {
      case "week":
        return gameDate >= subWeeks(now, 1);
      case "month":
        return gameDate >= subMonths(now, 1);
      case "6months":
        return gameDate >= subMonths(now, 6);
      case "year":
        return gameDate >= subMonths(now, 12);
      case "current_year":
        return isSameYear(gameDate, now);
      case "all":
      default:
        return true;
    }
  });
}

/**
 * Filter games by source (Chess.com, Lichess, etc.)
 */
export function filterGamesBySource(games: Game[], source: GameSource): Game[] {
  if (source === "all") return games;

  return games.filter((game) => {
    const origin = (game.importOrigin || "").toLowerCase();
    const url = (game.gameUrl || game.site || "").toLowerCase();

    if (source === "chesscom") {
      return origin === "chesscom" || url.includes("chess.com");
    } else if (source === "lichess") {
      return origin === "lichess" || url.includes("lichess");
    } else {
      // Other
      return (
        origin !== "chesscom" &&
        origin !== "lichess" &&
        !url.includes("chess.com") &&
        !url.includes("lichess")
      );
    }
  });
}

/**
 * Filter games to only include those from the current year
 * @deprecated Use filterGamesByPeriod(games, 'current_year') instead
 */
export function filterCurrentYear(games: Game[]): Game[] {
  return filterGamesByPeriod(games, "current_year");
}

/**
 * Parse time control from PGN to extract game type
 * Returns: "blitz", "rapid", "classical", or "unknown"
 */
export function parseTimeControl(pgn: string): {
  type: "blitz" | "rapid" | "classical" | "unknown";
  totalSeconds?: number;
} {
  const timeControlMatch = pgn.match(/\[TimeControl "([^"]+)"\]/);
  if (!timeControlMatch) return { type: "unknown" };

  const timeControl = timeControlMatch[1];

  // Handle special formats
  if (timeControl === "-" || timeControl === "?") return { type: "unknown" };

  // Parse format: "600+0" (base time + increment)
  const parts = timeControl.split("+");
  const baseTime = parseInt(parts[0]);

  if (isNaN(baseTime)) return { type: "unknown" };

  const totalSeconds = baseTime;

  // Categorize based on FIDE standards
  // Blitz: < 10 minutes
  // Rapid: 10-60 minutes
  // Classical: > 60 minutes
  if (totalSeconds < 600) {
    return { type: "blitz", totalSeconds };
  } else if (totalSeconds < 3600) {
    return { type: "rapid", totalSeconds };
  } else {
    return { type: "classical", totalSeconds };
  }
}

/**
 * Parse how the game ended from PGN
 * Returns: "checkmate", "resignation", "timeout", "draw", "unknown"
 */
export function parseTermination(
  pgn: string
): "checkmate" | "resignation" | "timeout" | "draw" | "unknown" {
  const terminationMatch = pgn.match(/\[Termination "([^"]+)"\]/);
  if (!terminationMatch) return "unknown";

  const termination = terminationMatch[1].toLowerCase();

  if (termination.includes("mate") || termination.includes("checkmate")) {
    return "checkmate";
  } else if (
    termination.includes("resign") ||
    termination.includes("abandon")
  ) {
    return "resignation";
  } else if (
    termination.includes("time") ||
    termination.includes("flag") ||
    termination.includes("timeout")
  ) {
    return "timeout";
  } else if (
    termination.includes("draw") ||
    termination.includes("agreement") ||
    termination.includes("stalemate") ||
    termination.includes("repetition") ||
    termination.includes("insufficient")
  ) {
    return "draw";
  }

  return "unknown";
}

/**
 * Estimate game duration in seconds
 * Uses time control if available, otherwise estimates from move count
 */
export function estimateGameDuration(game: Game): number {
  const timeControl = parseTimeControl(game.pgn);

  if (timeControl.totalSeconds) {
    // Estimate: average game uses 70% of allocated time
    return timeControl.totalSeconds * 0.7;
  }

  // Fallback: estimate from move count (average 30 seconds per move)
  const moves = game.pgn.split(/\d+\./).length - 1;
  return moves * 30;
}

/**
 * Calculate expected Elo change (simplified)
 */
export function calculateEloDelta(
  userRating: number,
  opponentRating: number,
  result: "win" | "draw" | "loss"
): number {
  const K = 32; // K-factor
  const expectedScore =
    1 / (1 + Math.pow(10, (opponentRating - userRating) / 400));

  const actualScore = result === "win" ? 1 : result === "draw" ? 0.5 : 0;

  return Math.round(K * (actualScore - expectedScore));
}

/**
 * Find the best victory (against highest rated opponent)
 */
export function findBestVictory(
  games: Game[],
  userName: string
): {
  game: Game;
  opponent: string;
  opponentRating: number;
  ratingDiff: number;
} | null {
  const victories = games.filter((game) => {
    const userIsWhite =
      game.userColor === "white" || game.white.name === userName;
    const userIsBlack =
      game.userColor === "black" || game.black.name === userName;

    if (!userIsWhite && !userIsBlack) return false;

    // Check if user won
    return (
      (userIsWhite && game.result === "1-0") ||
      (userIsBlack && game.result === "0-1")
    );
  });

  if (victories.length === 0) return null;

  let bestGame: Game | null = null;
  let maxOpponentRating = 0;

  victories.forEach((game) => {
    const userIsWhite =
      game.userColor === "white" || game.white.name === userName;
    const opponentRating = userIsWhite
      ? game.black.rating || 0
      : game.white.rating || 0;

    if (opponentRating > maxOpponentRating) {
      maxOpponentRating = opponentRating;
      bestGame = game;
    }
  });

  if (!bestGame) return null;

  const validBestGame = bestGame as Game;

  const userIsWhite =
    validBestGame.userColor === "white" ||
    validBestGame.white.name === userName;
  const opponent = userIsWhite
    ? validBestGame.black.name
    : validBestGame.white.name;
  const opponentRating = userIsWhite
    ? validBestGame.black.rating || 0
    : validBestGame.white.rating || 0;
  const userRating = userIsWhite
    ? validBestGame.white.rating || 0
    : validBestGame.black.rating || 0;

  return {
    game: validBestGame,
    opponent: opponent || "Unknown",
    opponentRating,
    ratingDiff: opponentRating - userRating,
  };
}

/**
 * Find the worst defeat (against lowest rated opponent)
 */
export function findWorstDefeat(
  games: Game[],
  userName: string
): {
  game: Game;
  opponent: string;
  opponentRating: number;
  ratingDiff: number;
} | null {
  const defeats = games.filter((game) => {
    const userIsWhite =
      game.userColor === "white" || game.white.name === userName;
    const userIsBlack =
      game.userColor === "black" || game.black.name === userName;

    if (!userIsWhite && !userIsBlack) return false;

    // Check if user lost
    return (
      (userIsWhite && game.result === "0-1") ||
      (userIsBlack && game.result === "1-0")
    );
  });

  if (defeats.length === 0) return null;

  let worstGame: Game | null = null;
  let minOpponentRating = Infinity;

  defeats.forEach((game) => {
    const userIsWhite =
      game.userColor === "white" || game.white.name === userName;
    const opponentRating = userIsWhite
      ? game.black.rating || Infinity
      : game.white.rating || Infinity;

    if (opponentRating > 0 && opponentRating < minOpponentRating) {
      minOpponentRating = opponentRating;
      worstGame = game;
    }
  });

  if (!worstGame || minOpponentRating === Infinity) return null;

  const validWorstGame = worstGame as Game;

  const userIsWhite =
    validWorstGame.userColor === "white" ||
    validWorstGame.white.name === userName;
  const opponent = userIsWhite
    ? validWorstGame.black.name
    : validWorstGame.white.name;
  const opponentRating = userIsWhite
    ? validWorstGame.black.rating || 0
    : validWorstGame.white.rating || 0;
  const userRating = userIsWhite
    ? validWorstGame.white.rating || 0
    : validWorstGame.black.rating || 0;

  return {
    game: validWorstGame,
    opponent: opponent || "Unknown",
    opponentRating,
    ratingDiff: opponentRating - userRating,
  };
}

/**
 * Find most frequent opponent
 */
export function findMostFrequentOpponent(
  games: Game[],
  userName: string
): {
  opponent: string;
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
} | null {
  const opponentMap = new Map<
    string,
    { wins: number; draws: number; losses: number }
  >();

  games.forEach((game) => {
    const userIsWhite =
      game.userColor === "white" || game.white.name === userName;
    const userIsBlack =
      game.userColor === "black" || game.black.name === userName;

    if (!userIsWhite && !userIsBlack) return;

    const opponent = userIsWhite
      ? game.black.name || "Unknown"
      : game.white.name || "Unknown";

    if (!opponentMap.has(opponent)) {
      opponentMap.set(opponent, { wins: 0, draws: 0, losses: 0 });
    }

    const stats = opponentMap.get(opponent)!;

    if (game.result === "1/2-1/2") {
      stats.draws++;
    } else if (
      (userIsWhite && game.result === "1-0") ||
      (userIsBlack && game.result === "0-1")
    ) {
      stats.wins++;
    } else {
      stats.losses++;
    }
  });

  if (opponentMap.size === 0) return null;

  let maxGames = 0;
  let mostFrequent: string | null = null;
  let bestStats = { wins: 0, draws: 0, losses: 0 };

  opponentMap.forEach((stats, opponent) => {
    const total = stats.wins + stats.draws + stats.losses;
    if (total > maxGames) {
      maxGames = total;
      mostFrequent = opponent;
      bestStats = stats;
    }
  });

  if (!mostFrequent) return null;

  return {
    opponent: mostFrequent,
    totalGames: maxGames,
    wins: bestStats.wins,
    draws: bestStats.draws,
    losses: bestStats.losses,
  };
}

/**
 * Get move count from PGN
 * Returns the number of full moves (e.g., 45 for a game with 45 full moves)
 * Uses chess.js to parse the PGN and count moves from the history
 */
export function getMoveCount(pgn: string): number {
  try {
    // Import Chess dynamically to parse PGN
    const { Chess } = require("chess.js");
    const chess = new Chess();

    // Load the PGN
    chess.loadPgn(pgn);

    // Get the move history and calculate full moves
    const history = chess.history();

    // Each full move = 2 half-moves (white + black)
    // If odd number of half-moves, round up
    return Math.ceil(history.length / 2);
  } catch (error) {
    // Fallback: try to extract the last move number from PGN
    const moveMatches = pgn.match(/(\d+)\./g);

    if (!moveMatches || moveMatches.length === 0) {
      return 0;
    }

    const lastMoveNumber = parseInt(
      moveMatches[moveMatches.length - 1].replace(".", "")
    );
    return isNaN(lastMoveNumber) ? 0 : lastMoveNumber;
  }
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${remainingMinutes > 0 ? remainingMinutes : ""}`;
}

/**
 * Get game type display label
 */
export function getGameTypeLabel(type: string): string {
  const lowerType = type.toLowerCase();
  const labels: Record<string, string> = {
    bullet: "Bullet",
    blitz: "Blitz",
    rapid: "Rapide",
    classical: "Classique",
  };
  return labels[lowerType] || "—";
}

/**
 * Classify game type from timeControl string
 * Examples: "180+0", "600+5", "1800"
 */
export function classifyGameType(timeControl: string): string {
  if (!timeControl) return "unknown";
  
  const parts = timeControl.split("+");
  const baseTime = parseInt(parts[0], 10) || 0;
  const increment = parts[1] ? parseInt(parts[1], 10) || 0 : 0;
  
  // Estimate total time as base + 40 moves * increment
  const totalSeconds = baseTime + (increment * 40);
  
  if (totalSeconds < 180) return "bullet";
  else if (totalSeconds < 600) return "blitz";
  else if (totalSeconds < 1800) return "rapid";
  else return "classical";
}
