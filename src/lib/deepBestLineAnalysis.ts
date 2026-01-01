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
): { description: string; themes: string[]; patterns?: any[]; depth: number } {
  if (!bestLineUci || bestLineUci.length === 0) {
    return { description: "", themes: [], patterns: [], depth: 0 };
  }

  const chess = new Chess(fenBefore);
  const actualDepth = Math.min(bestLineUci.length, maxDepth);

  for (let depth = 1; depth <= actualDepth; depth++) {
    try {
      // Reset position
      chess.load(fenBefore);
      
      // Play moves up to current depth
      const movesPlayed: string[] = [];
      let fenPrev = fenBefore;

      for (let i = 0; i < depth; i++) {
        if (i === depth - 1) {
             fenPrev = chess.fen();
        }

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
      // CRITICAL FIX: Use fenPrev (position right before the last move), NOT fenBefore (start of analysis)
      const result = analyzeTacticalPatterns(fenPrev, lastMoveSan, fenAfter);

      if (result.isTactical && result.description) {
        // console.log(`[Deep Analysis] Found tactics at depth ${depth}:`, result);
        return {
          description: result.description,
          themes: result.themes,
          patterns: result.patterns || [],
          depth: depth
        };
      }
    } catch (e) {
      // Silent error
    }
  }

  // Nothing found
  return { description: "", themes: [], patterns: [], depth: 0 };
}
