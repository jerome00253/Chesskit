/**
 * Game Classification Logic
 * Parses time control from PGN and classifies game type (Bullet, Blitz, Rapid, Classical)
 */

export interface TimeSettings {
  bulletMax: number; // Maximum minutes for Bullet (default: 3)
  blitzMax: number; // Maximum minutes for Blitz (default: 10)
  rapidMax: number; // Maximum minutes for Rapid (default: 60)
}

export const DEFAULT_TIME_SETTINGS: TimeSettings = {
  bulletMax: 3,
  blitzMax: 10,
  rapidMax: 60,
};

export interface ParsedTimeControl {
  initialTime: number; // Initial time in seconds
  increment: number; // Increment in seconds
}

/**
 * Parse PGN TimeControl string
 * Formats supported:
 * - "180" (3 minutes, no increment)
 * - "180+2" (3 minutes + 2 seconds increment)
 * - "3|0" (3 minutes, Chess.com format)
 * - "3+2" (3 minutes + 2 seconds)
 * - "600+10" (10 minutes + 10 seconds)
 */
export function parseTimeControl(
  timeControl: string | null | undefined
): ParsedTimeControl | null {
  if (!timeControl || timeControl === "-" || timeControl === "?") {
    return null;
  }

  // Remove spaces and convert to lowercase
  const tc = timeControl.trim();

  // Format: "180+2" or "180"
  if (tc.includes("+")) {
    const [initial, inc] = tc.split("+");
    const initialSeconds = parseInt(initial, 10);
    const increment = parseInt(inc, 10);

    if (!isNaN(initialSeconds) && !isNaN(increment)) {
      return { initialTime: initialSeconds, increment };
    }
  }

  // Format: "3|0" (Chess.com format - minutes)
  if (tc.includes("|")) {
    const [minutes, inc] = tc.split("|");
    const initialSeconds = parseInt(minutes, 10) * 60;
    const increment = parseInt(inc, 10);

    if (!isNaN(initialSeconds) && !isNaN(increment)) {
      return { initialTime: initialSeconds, increment };
    }
  }

  // Format: just seconds "180"
  const seconds = parseInt(tc, 10);
  if (!isNaN(seconds)) {
    return { initialTime: seconds, increment: 0 };
  }

  return null;
}

/**
 * Calculate estimated game duration in minutes
 * Formula: (initialTime + increment * 40) / 60
 * 40 is the average number of moves in a chess game
 */
export function calculateEstimatedDuration(parsed: ParsedTimeControl): number {
  const totalSeconds = parsed.initialTime + parsed.increment * 40;
  return totalSeconds / 60;
}

/**
 * Classify game type based on time control and user settings
 */
export function classifyGameType(
  timeControl: string | null | undefined,
  settings: TimeSettings = DEFAULT_TIME_SETTINGS
): string {
  const parsed = parseTimeControl(timeControl);

  if (!parsed) {
    return "Classical"; // Default to Classical if no time control
  }

  const durationMinutes = calculateEstimatedDuration(parsed);

  if (durationMinutes < settings.bulletMax) {
    return "Bullet";
  } else if (durationMinutes < settings.blitzMax) {
    return "Blitz";
  } else if (durationMinutes < settings.rapidMax) {
    return "Rapid";
  } else {
    return "Classical";
  }
}

/**
 * Get game type with all parsed data
 */
export function getGameClassification(
  timeControl: string | null | undefined,
  settings: TimeSettings = DEFAULT_TIME_SETTINGS
): {
  gameType: string;
  initialTime: number | null;
  increment: number | null;
  estimatedDuration: number | null;
} {
  const parsed = parseTimeControl(timeControl);

  if (!parsed) {
    return {
      gameType: "Classical",
      initialTime: null,
      increment: null,
      estimatedDuration: null,
    };
  }

  const durationMinutes = calculateEstimatedDuration(parsed);
  const gameType = classifyGameType(timeControl, settings);

  return {
    gameType,
    initialTime: parsed.initialTime,
    increment: parsed.increment,
    estimatedDuration: Math.round(durationMinutes * 10) / 10,
  };
}
