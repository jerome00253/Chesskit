
import { Chess, Move } from "chess.js";

interface TacticalResult {
  tactical: boolean;
  themes: string[];
  description: string;
}

export const analyzeTactics = (
  gameFen: string,
  moveSan: string,
  evalDiff: number | null,
  classification: string | undefined,
  bestMove: string | undefined
): TacticalResult => {
  const chess = new Chess(gameFen);
  
  // Try to find the move in legal moves to get details (flags, etc)
  // Note: gameFen is the position AFTER the move. So we can't find the move that led to it easily from just FEN.
  // Ideally, proper analysis requires the FEN BEFORE the move.
  // However, for basic checks (Is the King in check now?), the current FEN is fine.
  
  const themes: string[] = [];
  let isTactical = false;

  // 1. Check & Mate (Current Position)
  if (chess.isCheckmate()) {
    themes.push("Checkmate");
    isTactical = true;
  } else if (chess.isCheck()) {
    themes.push("Check");
    isTactical = true;
  } else if (chess.isStalemate()) {
    themes.push("Stalemate");
    isTactical = true;
  }

  // 2. Move-based heuristics (requires parsing the SAN)
  // SAN contains info: 'Nxf3+' -> capture, check
  if (moveSan.includes("x")) {
    themes.push("Capture");
  }
  if (moveSan.includes("=")) {
    themes.push("Promotion");
    isTactical = true;
  }

  // 3. Evaluation-based heuristics
  if (classification === "blunder") {
    themes.push("Blunder");
    // If it's a huge swing, it's likely a tactical oversight
    if (evalDiff && Math.abs(evalDiff) > 200) {
        isTactical = true;
    }
  } else if (classification === "brilliant" || classification === "great") {
    themes.push("Brilliant");
    isTactical = true;
  }

  // 4. Advanced Heuristics (Approximations)
  // Hanging Piece: Simple check - if we lost material (eval dropped) and it wasn't a forced mate
  if (evalDiff && evalDiff < -200 && !themes.includes("Checkmate")) {
      // Could be hanging piece or missed tactic
      // Without previous board state, hard to confirm "Hanging", but we can tag "Material Loss"
      themes.push("Material Loss");
  }

  // Generate Description
  let description = "";
  if (themes.includes("Checkmate")) {
      description = "Partie terminée par échec et mat.";
  } else if (classification === "blunder") {
      const loss = evalDiff ? Math.abs(Math.round(evalDiff) / 100) : "?";
      description = `Erreur critique. Vous perdez environ ${loss} points d'évaluation.`;
      if (bestMove) description += ` Stockfish préférait ${bestMove}.`;
  } else if (classification === "brilliant") {
      description = "Un coup brillant !";
  } else if (themes.includes("Check")) {
      description = "Un échec qui force le roi à réagir.";
  } else {
       // Generic fallback
       description = `${moveSan} joué.`;
  }

  return {
    tactical: isTactical,
    themes,
    description,
  };
};
