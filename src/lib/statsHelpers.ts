import { Game } from "@/types/game";

/**
 * Filter games to only include those from the current year
 */
export function filterCurrentYear(games: Game[]): Game[] {
  const currentYear = new Date().getFullYear();
  return games.filter((game) => {
    if (!game.date) return false;
    // Parse date from PGN format (YYYY.MM.DD)
    const year = parseInt(game.date.split(".")[0]);
    return year === currentYear;
  });
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
  const increment = parts[1] ? parseInt(parts[1]) : 0;

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

  const userIsWhite =
    bestGame.userColor === "white" || bestGame.white.name === userName;
  const opponent = userIsWhite ? bestGame.black.name : bestGame.white.name;
  const opponentRating = userIsWhite
    ? bestGame.black.rating || 0
    : bestGame.white.rating || 0;
  const userRating = userIsWhite
    ? bestGame.white.rating || 0
    : bestGame.black.rating || 0;

  return {
    game: bestGame,
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

  const userIsWhite =
    worstGame.userColor === "white" || worstGame.white.name === userName;
  const opponent = userIsWhite ? worstGame.black.name : worstGame.white.name;
  const opponentRating = userIsWhite
    ? worstGame.black.rating || 0
    : worstGame.white.rating || 0;
  const userRating = userIsWhite
    ? worstGame.white.rating || 0
    : worstGame.black.rating || 0;

  return {
    game: worstGame,
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
 */
export function getMoveCount(pgn: string): number {
  const moves = pgn.split(/\d+\./).length - 1;
  return Math.max(0, moves);
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
  return `${hours}h${remainingMinutes > 0 ? remainingMinutes : ''}`;
}

/**
 * Get game type display label
 */
export function getGameTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    blitz: "Blitz",
    rapid: "Rapide",
    classical: "Classique",
    unknown: "—",
  };
  return labels[type] || "—";
}
