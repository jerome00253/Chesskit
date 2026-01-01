/**
 * Shared Critical Moment Builder
 * Used by both useGameDatabase.ts (single game analysis) and useBulkAnalysis.ts (bulk analysis)
 * to ensure consistent tactical description generation.
 */

import { Chess } from "chess.js";
import { analyzeTacticalPatterns } from "@/lib/tactical";
import { MoveClassification } from "@/types/enums";

import { getMovesClassification } from "@/lib/engine/helpers/moveClassification";

export interface GamePosition {
  lines?: Array<{ cp?: number; mate?: number }>;
  bestMove?: string;
  moveClassification?: string;
}

export interface CriticalMomentInput {
  positions: GamePosition[];
  fens: string[];
  moves: string[]; // SAN moves array
  uciMoves?: string[]; // UCI moves array (required for classification)
  userColor?: string;
  multiPv?: number;
}

export interface CriticalMoment {
  ply: number;
  fen: string;
  move: string;
  bestMove?: string;
  bestMoveSan?: string;
  type: string;
  evalBefore: number | null;
  evalAfter: number | null;
  evalDiff: number | null;
  playerColor: string;
  isUserMove: boolean;
  bestLines: any[];
  multiPvLines: number;
  positionContext: string;
  tactical: boolean;
  themes: string[];
  description: string;
  descriptionEn?: string;
  descriptionFr?: string;
  descriptionIt?: string;
  descriptionPt?: string;
  descriptionEs?: string;
  descriptionNl?: string;
  bestLineDescription: string;
  bestLineTheme: string[];
  bestLinePositionContext: string;
  globalDescription: string;
}

/**
 * Build critical moments from game evaluation data.
 * This function is shared between single game and bulk analysis.
 */
export function buildCriticalMoments(input: CriticalMomentInput): CriticalMoment[] {
  const { positions, fens, moves, uciMoves, userColor, multiPv = 1 } = input;
  const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  // Calculate move classification if missing and uciMoves are provided
  let enrichedPositions = positions;
  // We check if the first position lacks classification to decide if we need to compute it
  // Note: Cast as any to avoid strict type checks on importing the helper return type vs local interface
  if (uciMoves && positions.length > 0 && !(positions[0] as any).moveClassification) {
    try {
        enrichedPositions = getMovesClassification(positions as any, uciMoves, fens) as unknown as GamePosition[];
    } catch (e) {
        console.warn("Failed to compute move classification:", e);
    }
  }

  const criticalMoments: CriticalMoment[] = [];

  for (let idx = 0; idx < enrichedPositions.length; idx++) {
    const pos = enrichedPositions[idx];
    const posAfter = enrichedPositions[idx+1]; // Post-move position containing move classification
    
    // Get FENs - fens[0] is starting position, fens[idx+1] is after move idx
    const fenBefore = fens[idx] || startFen;
    const positionFen = fens[idx + 1] || "";
    const moveSan = moves[idx] || "";

    // Skip if no move (starting position or invalid)
    if (!moveSan || !positionFen) continue;

    // Perform Tactical Analysis
    let analysisResult = {
      tactical: false,
      themes: [] as string[],
      description: "",
      descriptionEn: "",
      descriptionFr: "",
    };
    let detailedPatterns: any[] = [];

    if (positionFen && moveSan && fenBefore) {
      try {
        // Use new tactical system with JSON i18n keys
        const result = analyzeTacticalPatterns(
          fenBefore,  // FEN before move
          moveSan,    // Move in SAN
          positionFen // FEN after move
        );
        
        analysisResult.tactical = result.isTactical;
        analysisResult.themes = result.themes;
        analysisResult.description = result.description;  // JSON i18n key
        if (result.patterns) detailedPatterns = result.patterns;
      } catch (e) {
        console.warn("Tactical analysis failed:", e);
      }
    }

    // Best line analysis
    let bestLineAnalysis = {
      description: "",
      themes: [] as string[],
      positionContext: "",
      patterns: [] as any[],
    };

    // Convert UCI to SAN if bestMove exists
    let bestMoveSan = pos.bestMove || ""; // fallback to UCI

    if (pos.bestMove && fenBefore) {
      try {
        // We simulate the best move from the position BEFORE the player's move
        // to compare the played move with the engine's suggestion.
        const tempChess = new Chess(fenBefore);
        const from = pos.bestMove.substring(0, 2);
        const to = pos.bestMove.substring(2, 4);
        const promotion = pos.bestMove.length > 4 ? pos.bestMove[4] : undefined;
        const moveResult = tempChess.move({ from, to, promotion });

        if (moveResult) {
          bestMoveSan = moveResult.san;
          const fenAfterBestMove = tempChess.fen();

          // Analyze what the best move brings tactically
          const bestMoveResult = analyzeTacticalPatterns(
            fenBefore,           // FEN before any move
            moveResult.san,      // Best move in SAN
            fenAfterBestMove     // FEN after best move
          );

          bestLineAnalysis.description = bestMoveResult.description;  // JSON i18n key
          bestLineAnalysis.themes = bestMoveResult.themes;
          if (bestMoveResult.patterns && bestMoveResult.patterns.length > 0) {
            bestLineAnalysis.positionContext = JSON.stringify(bestMoveResult.patterns);
          }
        }
      } catch (e) {
        console.warn("Best line analysis failed:", e);
      }
    }

    const type = posAfter?.moveClassification || "info";

    // Filter: Blunder/Mistake/Excellent/Best OR Tactical Pattern
    if (
      type === "blunder" ||
      type === "mistake" ||
      type === "excellent" ||
      type === "best" ||
      type === MoveClassification.Blunder ||
      type === MoveClassification.Mistake ||
      type === MoveClassification.Excellent ||
      type === MoveClassification.Best ||
      detailedPatterns.length > 0
    ) {
      // Extract evaluations
      const prevLine = pos.lines?.[0]; // Eval before move
      const currLine = posAfter?.lines?.[0]; // Eval after move

      let evalBefore: number | null = null;
      let evalAfter: number | null = null;

      // evalBefore from previous position's best line
      if (prevLine) {
        if (prevLine.cp !== undefined) {
          evalBefore = prevLine.cp;
        } else if (prevLine.mate !== undefined) {
          evalBefore = prevLine.mate > 0 ? 10000 : -10000;
        }
      }

      // evalAfter from current position's best line
      if (currLine) {
        if (currLine.cp !== undefined) {
          evalAfter = currLine.cp;
        } else if (currLine.mate !== undefined) {
          evalAfter = currLine.mate > 0 ? 10000 : -10000;
        }
      }

      // Calculate evalDiff (from player's perspective)
      let evalDiff: number | null = null;
      if (evalBefore !== null && evalAfter !== null) {
        const isWhite = idx % 2 === 0;
        const rawDiff = evalAfter - evalBefore;
        evalDiff = isWhite ? rawDiff : -rawDiff;
      }

      // Player context
      const isWhite = idx % 2 === 0;
      const playerColor = isWhite ? "white" : "black";
      const isUserMove = userColor ? userColor === playerColor : false;

      // Check if the played move is already the best move
      const isBestMove = moveSan === bestMoveSan;

      criticalMoments.push({
        ply: idx + 1, // 1-indexed ply
        fen: positionFen,
        move: moveSan,
        bestMove: pos.bestMove,
        bestMoveSan,
        type,
        evalBefore,
        evalAfter,
        evalDiff,
        playerColor,
        isUserMove,
        bestLines: posAfter?.lines || [],
        multiPvLines: multiPv,
        positionContext: JSON.stringify(detailedPatterns),
        tactical: analysisResult.tactical,
        themes: analysisResult.themes,
        description: analysisResult.description || "",
        descriptionEn: analysisResult.descriptionEn || analysisResult.description || "",
        descriptionFr: analysisResult.descriptionFr || "",
        descriptionIt: analysisResult.descriptionIt || "",
        descriptionPt: analysisResult.descriptionPt || "",
        descriptionEs: analysisResult.descriptionEs || "",
        descriptionNl: analysisResult.descriptionNl || "",
        bestLineDescription: bestLineAnalysis.description || "",
        bestLineTheme: bestLineAnalysis.themes || [],
        bestLinePositionContext: JSON.stringify(bestLineAnalysis.patterns || []),
        globalDescription: [
          analysisResult.description,
          (!isBestMove && bestLineAnalysis.description && bestLineAnalysis.description.trim() && analysisResult.description !== bestLineAnalysis.description)
            ? `En jouant ${bestMoveSan}, ${bestLineAnalysis.description}`
            : (!isBestMove && bestMoveSan ? `Nous aurions pu jouer ${bestMoveSan}` : "")
        ].filter(Boolean).join(" "),
      });
    }
  }

  return criticalMoments;
}
