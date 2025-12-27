import { openings } from "@/data/openings";

// Create a map for O(1) lookup
// We normalize FENs to ensure consistent matching (just piece placement)
const openingsMap = new Map<string, string>();
let isMapInitialized = false;

const initMap = () => {
  if (isMapInitialized) return;
  openings.forEach((op) => {
    // Ensure we only use the piece placement part of the FEN if the source has more
    const fenKey = op.fen.split(" ")[0];
    openingsMap.set(fenKey, op.name);
  });
  isMapInitialized = true;
};

export const identifyOpening = (
  fens: string[]
): { name: string; eco?: string } | null => {
  initMap();

  // Iterate through FENs and look for the "deepest" match
  // We can iterate backwards from the end of the game, or forwards?
  // Usually openings are at the beginning. But we want the specific variation.
  // Variations appear later in the game. So we want the match that corresponds to the LATEST FEN in the game.

  // We should check forwards, keeping track of the last match found.
  let lastMatch: string | null = null;
  let matchesFound = 0;

  // Optimisation: Openings rarely go beyond move 20-25.
  // But let's check the first 30 moves (60 plies) just to be safe.
  const limit = Math.min(fens.length, 60);

  for (let i = 0; i < limit; i++) {
    const fen = fens[i];
    const fenKey = fen.split(" ")[0]; // Compare only piece placement

    const match = openingsMap.get(fenKey);
    if (match) {
      lastMatch = match;
      matchesFound++;
    } else {
      // If we found matches before but now stopped finding them,
      // it means we left the "book". The last match was the opening.
      if (matchesFound > 0) {
        break;
      }
    }
  }

  if (lastMatch) {
    return {
      name: lastMatch,
      eco: undefined, // Our local DB doesn't have ECO codes
    };
  }

  return null;
};
