import { Chess } from "chess.js";
import { analyzeTacticalPatterns } from "./tactical";

/**
 * Analyze best line in depth (1-5 moves) until a tactical pattern is found
 * @param fenBefore - FEN before the best move
 * @param bestLineUci - Array of UCI moves representing the best line
 * @param maxDepth - Maximum depth to analyze (default 5)
 * @returns Analysis result with description and themes, or empty if nothing found
 */
export function analyzeDeepBestLine(
  fenBefore: string,
  bestLineUci: string[],
  maxDepth: number = 5
): { description: string; themes: string[]; depth: number } {
  if (!bestLineUci || bestLineUci.length === 0) {
    return { description: "", themes: [], depth: 0 };
  }

  const chess = new Chess(fenBefore);
  const actualDepth = Math.min(bestLineUci.length, maxDepth);

  for (let depth = 1; depth <= actualDepth; depth++) {
    try {
      // Reset position
      chess.load(fenBefore);
      
      // Play moves up to current depth
      const movesPlayed: string[] = [];
      for (let i = 0; i < depth; i++) {
        const uci = bestLineUci[i];
        const from = uci.substring(0, 2);
        const to = uci.substring(2, 4);
        const promotion = uci.length > 4 ? uci[4] : undefined;
        
        const moveResult = chess.move({ from, to, promotion });
        if (!moveResult) break;
        movesPlayed.push(moveResult.san);
      }

      if (movesPlayed.length !== depth) continue;

      const fenAfter = chess.fen();
      const lastMoveSan = movesPlayed[movesPlayed.length - 1];

      // Analyze the position after this sequence
      const result = analyzeTacticalPatterns(fenBefore, lastMoveSan, fenAfter);

      if (result.isTactical && result.description) {
        console.log(`[Deep Analysis] Found tactics at depth ${depth}:`, result);
        return {
          description: result.description,
          themes: result.themes,
          depth: depth
        };
      }
    } catch (e) {
      console.warn(`[Deep Analysis] Error at depth ${depth}:`, e);
    }
  }

  // Nothing found
  return { description: "", themes: [], depth: 0 };
}
