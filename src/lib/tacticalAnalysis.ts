
import { Chess } from "chess.js";
import { analyzeTacticalPatterns } from "./tactical";

interface TacticalResult {
  tactical: boolean;
  themes: string[];
  description: string;
  descriptionEn?: string;
  descriptionFr?: string;
  descriptionIt?: string;
  descriptionPt?: string;
  descriptionEs?: string;
  descriptionNl?: string;
  patterns?: any[];
}

export const analyzeTactics = (
  gameFen: string,
  moveSan: string,
  evalDiff: number | null,
  classification: string | undefined,
  bestMove: string | undefined,
  fenBefore?: string 
): TacticalResult => {

  
  const chess = new Chess(gameFen);
  
  // Initialize result
  const themes: string[] = [];
  let isTactical = false;
  let description = "";
  let descriptionEn = "";
  let descriptionFr = "";
  let descriptionIt = "";
  let descriptionPt = "";
  let descriptionEs = "";
  let descriptionNl = "";
  let detailedPatterns: any[] = [];

  // 0. Use new Tactical Engine if fenBefore is available
  if (fenBefore) {
      try {
        const advancedAnalysis = analyzeTacticalPatterns(fenBefore, moveSan, gameFen);
        if (advancedAnalysis.isTactical) {
            
            isTactical = true;
            themes.push(...advancedAnalysis.themes);
            if (advancedAnalysis.patterns) {
               detailedPatterns = advancedAnalysis.patterns;
            }
            if (advancedAnalysis.description) {
                description = advancedAnalysis.description + " ";
            }
            if (advancedAnalysis.descriptionEn) descriptionEn = advancedAnalysis.descriptionEn;
            if (advancedAnalysis.descriptionFr) descriptionFr = advancedAnalysis.descriptionFr;
        }
      } catch (e) {
          console.error("Advanced tactical analysis failed:", e);
      }
  }

  // 1. Check & Mate (Current Position) - utilizing chess.js for robustness
  if (chess.isCheckmate()) {
    if (!themes.includes("Checkmate")) themes.push("Checkmate");
    isTactical = true;
  } else if (chess.isCheck()) {
     if (!themes.includes("Check")) themes.push("Check");
    isTactical = true;
  } else if (chess.isStalemate()) {
     if (!themes.includes("Stalemate")) themes.push("Stalemate");
    isTactical = true;
  }

  // 2. Move-based heuristics (requires parsing the SAN)
  // SAN contains info: 'Nxf3+' -> capture, check
  if (moveSan.includes("x")) {
    if (!themes.includes("Capture")) themes.push("Capture");
  }
  if (moveSan.includes("=")) {
     if (!themes.includes("Promotion")) themes.push("Promotion");
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
      themes.push("Material Loss");
  }

  // Generate Description (refine if advanced desc exists)
  // Generate Description (refine if advanced desc exists)
  if (!description) {
      if (themes.includes("Checkmate")) {
          descriptionEn = "Game ended by checkmate.";
          descriptionFr = "Partie terminée par échec et mat.";
          descriptionIt = "Partita terminata con scacco matto.";
          descriptionPt = "Jogo terminado por xeque-mate.";
          descriptionEs = "Juego terminado por jaque mate.";
          descriptionNl = "Spel beëindigd door schaakmat.";
      } else if (classification === "blunder") {
          const loss = evalDiff ? Math.abs(Math.round(evalDiff) / 100) : "?";
          descriptionEn = `Critical error. You lose about ${loss} evaluation points.`;
          descriptionFr = `Erreur critique. Vous perdez environ ${loss} points d'évaluation.`;
          descriptionIt = `Errore critico. Perdi circa ${loss} punti di valutazione.`;
          descriptionPt = `Erro crítico. Você perde cerca de ${loss} pontos de avaliação.`;
          descriptionEs = `Error crítico. Pierdes aproximadamente ${loss} puntos de evaluación.`;
          descriptionNl = `Kritieke fout. Je verliest ongeveer ${loss} evaluatiepunten.`;
          if (bestMove) {
              descriptionEn += ` Stockfish preferred ${bestMove}.`;
              descriptionFr += ` Stockfish préférait ${bestMove}.`;
              descriptionIt += ` Stockfish preferiva ${bestMove}.`;
              descriptionPt += ` Stockfish preferia ${bestMove}.`;
              descriptionEs += ` Stockfish prefería ${bestMove}.`;
              descriptionNl += ` Stockfish verkoos ${bestMove}.`;
          }
      } else if (classification === "brilliant") {
          descriptionEn = "A brilliant move!";
          descriptionFr = "Un coup brillant !";
          descriptionIt = "Una mossa brillante!";
          descriptionPt = "Um lance brilhante!";
          descriptionEs = "¡Un movimiento brillante!";
          descriptionNl = "Een briljante zet!";
      } else if (themes.includes("Check")) {
          descriptionEn = "A check forcing the king to react.";
          descriptionFr = "Un échec qui force le roi à réagir.";
          descriptionIt = "Uno scacco che costringe il re a reagire.";
          descriptionPt = "Um xeque que força o rei a reagir.";
          descriptionEs = "Un jaque que obliga al rey a reaccionar.";
          descriptionNl = "Een schaak dat de koning dwingt te reageren.";
      }
      // Note: Generic fallback removed - we now use i18n system from describer.ts
      
      // Default to English for the main description field if empty
      if (descriptionEn) description = descriptionEn;
  } else {
      // Append context if needed (Advanced patterns already handled EN/FR mostly in describer, 
      // but here we might append specific blunders info if mixed?)
      // For now, let's keep it simple. If we have advanced description, we trust it.
      // But if it's a blunder AND a tactical pattern (e.g. pinned piece lost), we might want to add eval info.
      
      if (classification === "blunder") {
           const loss = evalDiff ? Math.abs(Math.round(evalDiff) / 100) : "?";
           if (!descriptionEn.includes("Critical error")) descriptionEn += ` (Blunder: -${loss})`;
           if (!descriptionFr.includes("Erreur critique")) descriptionFr += ` (Gaffe : -${loss})`;
           if (descriptionIt && !descriptionIt.includes("Errore critico")) descriptionIt += ` (Errore: -${loss})`;
           if (descriptionPt && !descriptionPt.includes("Erro crítico")) descriptionPt += ` (Erro: -${loss})`;
           if (descriptionEs && !descriptionEs.includes("Error crítico")) descriptionEs += ` (Error: -${loss})`;
           if (descriptionNl && !descriptionNl.includes("Kritieke fout")) descriptionNl += ` (Blunder: -${loss})`;
      }
      
      // Update main description fallback
      if (!description) description = descriptionEn;
  }

  return {
    tactical: isTactical,
    themes: Array.from(new Set(themes)), // Dedup
    description: description.trim(),
    descriptionEn: descriptionEn.trim(),
    descriptionFr: descriptionFr.trim(),
    descriptionIt: descriptionIt.trim(),
    descriptionPt: descriptionPt.trim(),
    descriptionEs: descriptionEs.trim(),
    descriptionNl: descriptionNl.trim(),
    patterns: detailedPatterns
  };
};
