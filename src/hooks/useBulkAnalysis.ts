import { useState, useCallback, useRef } from "react";
import { EngineName, MoveClassification } from "@/types/enums";
import { Chess } from "chess.js";
import type { GameEval } from "@/types/eval";
import { getEvaluateGameParams } from "@/lib/chess";
import { useEngine } from "@/hooks/useEngine";
import { fetchLichessOpening } from "@/lib/lichess";
import { identifyOpening } from "@/lib/opening";
import { analyzeTactics } from "@/lib/tacticalAnalysis";
import { useAtom } from "jotai";
import { gamesAtom } from "@/atoms/chess";

export interface BulkAnalysisSettings {
  engineName: EngineName;
  engineDepth: number;
  engineMultiPv: number;
  boardHue: number;
  pieceSet: string;
  showBestMove: boolean;
  showPlayerMove: boolean;
  workersNb: number;
}

export interface BulkAnalysisState {
  isAnalyzing: boolean;
  currentGameIndex: number;
  totalGames: number;
  currentGameProgress: number;
  currentGameMoves?: { current: number; total: number };
  error: string | null;
}

export function useBulkAnalysis() {
  const [state, setState] = useState<BulkAnalysisState>({
    isAnalyzing: false,
    currentGameIndex: 0,
    totalGames: 0,
    currentGameProgress: 0,
    error: null,
  });

  const [games] = useAtom(gamesAtom);

  // Get engine hooks for each engine type
  const stockfish17 = useEngine(EngineName.Stockfish17Lite);
  const stockfish16 = useEngine(EngineName.Stockfish16_1Lite);
  const stockfish11 = useEngine(EngineName.Stockfish11);

  const getEngineByName = useCallback(
    (engineName: EngineName) => {
      switch (engineName) {
        case EngineName.Stockfish17Lite:
          return stockfish17;
        case EngineName.Stockfish16_1Lite:
          return stockfish16;
        case EngineName.Stockfish11:
          return stockfish11;
        default:
          return stockfish17;
      }
    },
    [stockfish17, stockfish16, stockfish11]
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeGames = useCallback(
    async (gameIds: number[], settings: BulkAnalysisSettings) => {
      // Reset state
      setState({
        isAnalyzing: true,
        currentGameIndex: 0,
        totalGames: gameIds.length,
        currentGameProgress: 0,
        error: null,
      });

      abortControllerRef.current = new AbortController();

      const engine = getEngineByName(settings.engineName);

      if (!engine?.getIsReady()) {
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: `Engine ${settings.engineName} not ready`,
        }));
        return;
      }

      try {
        for (let i = 0; i < gameIds.length; i++) {
          // Check if cancelled
          if (abortControllerRef.current.signal.aborted) {
            throw new Error("Analyse annulée");
          }

          setState((prev) => ({
            ...prev,
            currentGameIndex: i,
            currentGameProgress: 0,
            currentGameMoves: undefined,
          }));

          const gameId = gameIds[i];
          const game = games.find(g => g.id === gameId);

          // 1. Fetch game data
          const gameResponse = await fetch(`/api/games/${gameIds[i]}`);
          if (!gameResponse.ok) {
            throw new Error(
              `Erreur lors du chargement de la partie ${gameIds[i]}`
            );
          }
          const gameData = await gameResponse.json();

          // 2. Parse PGN

          // 2. Parse PGN and get Moves
          const chess = new Chess();
          chess.loadPgn(gameData.pgn);
          // Get SAN moves (history)
          const sanMoves = chess.history(); 
          
          const params = getEvaluateGameParams(chess);
          const totalMoves = params.fens.length;

          // Skip games with 0 or 1 move
          if (totalMoves <= 1) {
            setState((prev) => ({
              ...prev,
              currentGameProgress: 100,
            }));
            continue;
          }

          // 3. Analyze with Stockfish
          const gameEval: GameEval = await engine.evaluateGame({
            ...params,
            depth: settings.engineDepth,
            multiPv: settings.engineMultiPv,
            setEvaluationProgress: (progress: number) => {
              const positionIndex = Math.floor((progress / 100) * totalMoves);
              setState((prev) => ({
                ...prev,
                currentGameProgress: progress,
                currentGameMoves: {
                  current: positionIndex,
                  total: totalMoves,
                },
              }));
            },
            workersNb: settings.workersNb,
          });

          // 4. Process analysis data to match DB schema
          const header = chess.header();
          let openingName: string | undefined = header["Opening"] || undefined;
          let openingECO: string | undefined = header["ECO"] || undefined;

          // Try local opening detection if name is missing
          if (!openingName) {
            const localOpening = identifyOpening(params.fens);
            if (localOpening) {
              openingName = localOpening.name;
              // Local DB doesn't have ECO, so we leave it as is
            }
          }

          // If opening info is still missing (ECO or Name), try to fetch it from Lichess Explorer
          if (!openingName || !openingECO) {
            try {
              // Get UCI moves for the explorer
              const uciMoves = params.uciMoves;
              const lichessOpening = await fetchLichessOpening(uciMoves);

              if (lichessOpening) {
                // Only overwrite if missing
                if (!openingName) openingName = lichessOpening.name;
                if (!openingECO) openingECO = lichessOpening.eco;
              }
            } catch (err) {
              console.warn("Failed to fetch opening info:", err);
            }

            // Fallback: Use ECO if Name is still missing
            if (!openingName && openingECO) {
              openingName = openingECO;
            }
          }

          // Calculate move quality counts
          const moveCounts = {
            white: {
              brilliant: 0,
              splendid: 0,
              perfect: 0,
              best: 0,
              excellent: 0,
              okay: 0,
              opening: 0,
              inaccuracy: 0,
              mistake: 0,
              blunder: 0,
            },
            black: {
              brilliant: 0,
              splendid: 0,
              perfect: 0,
              best: 0,
              excellent: 0,
              okay: 0,
              opening: 0,
              inaccuracy: 0,
              mistake: 0,
              blunder: 0,
            },
          };

          // Process positions to create move evaluations and critical moments
          const moveEvaluations = gameEval.positions.map((pos, index) => {
            // positions[0] is White's first move, positions[1] is Black's first move, etc.
            // So: index % 2 === 0 → White, index % 2 === 1 → Black
            const isWhite = index % 2 === 0;
            const classification = pos.moveClassification || undefined;
            const bestMove = pos.bestMove || undefined;

            // Update counts
            if (classification) {
              const color = isWhite ? "white" : "black";

              // Count each classification separately
              // Note: 'Brilliant' is not in the MoveClassification enum, only a DB field
              if (classification === MoveClassification.Splendid)
                moveCounts[color].splendid++;
              else if (classification === MoveClassification.Perfect)
                moveCounts[color].perfect++;
              else if (classification === MoveClassification.Best)
                moveCounts[color].best++;
              else if (classification === MoveClassification.Excellent)
                moveCounts[color].excellent++;
              else if (classification === MoveClassification.Okay)
                moveCounts[color].okay++;
              else if (
                classification === MoveClassification.Opening ||
                classification === MoveClassification.Forced
              )
                moveCounts[color].opening++;
              else if (classification === MoveClassification.Inaccuracy)
                moveCounts[color].inaccuracy++;
              else if (classification === MoveClassification.Mistake)
                moveCounts[color].mistake++;
              else if (classification === MoveClassification.Blunder)
                moveCounts[color].blunder++;
            }

            // Get evaluation (cp or mate)
            const line = pos.lines[0];
            const evalValue = line?.mate
              ? line.mate > 0
                ? 2000
                : -2000
              : line?.cp || 0;

            return {
              ply: index + 1, // 1-indexed ply
              eval: evalValue,
              bestMove: bestMove,
              classification: classification,
              evalDiff: null, // explicit null is allowed for this field
            };
          });

          // Identify critical moments including TACTICAL PATTERNS
          const criticalMoments = gameEval.positions
            .map((pos, index) => {
              if (index === 0) return null; // Start position has no move
              
              // Move and FENs
              const moveSan = sanMoves[index - 1] || "";
              // IMPORTANT: params.fens[0] is the starting position
              // positions[0] is the first move, positions[1] is the second move, etc.
              // params.fens[i] is the FEN AFTER positions[i-1] (or starting position if i=0)
              // So for positions[index], we need:
              //   - fenBefore = params.fens[index - 1] (FEN before the move)
              //   - positionFen = params.fens[index] (FEN after the move)
              const fenBefore = params.fens[index - 1] || "";
              const positionFen = params.fens[index] || "";

              // Perform Tactical Analysis
              let analysisResult = {
                tactical: false,
                themes: [] as string[],
                description: "",
                descriptionEn: "",
                descriptionFr: "",
              };
              let detailedPatterns: any[] = [];
              
              if (positionFen && moveSan) {
                  try {
                  const result = analyzeTactics(
                        positionFen, // FEN after the move (standard 1st arg for analyzeTactics)
                        moveSan,
                        null, 
                        pos.moveClassification,
                        gameEval.positions[index - 1]?.bestMove, // Use previous position's best move
                        fenBefore // FEN before the move (last arg, used for parsing SAN)
                      );
                      if (result.descriptionEn) analysisResult.descriptionEn = result.descriptionEn;
                      if (result.descriptionFr) analysisResult.descriptionFr = result.descriptionFr;
                      analysisResult.tactical = result.tactical;
                      analysisResult.themes = result.themes;
                      analysisResult.description = result.description;
                      if (result.patterns) detailedPatterns = result.patterns;
                  } catch (e) {
                      console.warn("Tactical analysis failed for bulk:", e);
                  }
              }

              // NEW: Analyze the              // Best line analysis
              let bestLineAnalysis: {
                description: string;
                themes: string[];
                positionContext: string;
                patterns?: any[];
              } = {
                description: "",
                themes: [],
                positionContext: "",
                patterns: []
              };
              
              // Convert UCI to SAN if bestMove exists
              let bestMoveSan = pos.bestMove; // fallback to UCI
              
              if (pos.bestMove && fenBefore) {
                try {
                  const tempChessForSan = new Chess(fenBefore);
                  const from = pos.bestMove.substring(0, 2);
                  const to = pos.bestMove.substring(2, 4);
                  const promotion = pos.bestMove.length > 4 ? pos.bestMove[4] : undefined;
                  const moveObj = { from, to, promotion };
                  const moveResultForSan = tempChessForSan.move(moveObj);
                  if (moveResultForSan) {
                    bestMoveSan = moveResultForSan.san;
                  }
                } catch (e) {
                  console.warn("Failed to convert bestMove UCI to SAN:", e);
                }
              }

              // Use previous position's best move (the move that *should* have been played)
              const bestMove = gameEval.positions[index - 1]?.bestMove;

              if (bestMove && fenBefore) {
                try {
                  // Play the best move to get the resulting FEN
                  // IMPORTANT: bestMove is the alternative move the player SHOULD have played
                  // So we use fenBefore (the position BEFORE the player's actual move)
                  const tempChess = new Chess(fenBefore);
                  // bestMove is in UCI format (e.g., "e2e4"), convert to chess.js format
                  const from = bestMove.substring(0, 2);
                  const to = bestMove.substring(2, 4);
                  const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
                  const moveObj = { from, to, promotion };
                  const moveResult = tempChess.move(moveObj);
                  
                  if (moveResult) {
                    const fenAfterBestMove = tempChess.fen();
                    
                    // Analyze what the best move brings tactically
                    // Use SAN from moveResult, not UCI from bestMove
                    const bestMoveResult = analyzeTactics(
                      fenAfterBestMove,
                      moveResult.san, // SAN notation (e.g., "Nf3")
                      null, // evalDiff will be calculated separately
                      "best", // Classification
                      undefined,
                      fenBefore // Use fenBefore as the FEN state before the best move
                    );
                    
                    bestLineAnalysis.description = bestMoveResult.descriptionEn || bestMoveResult.description;
                    bestLineAnalysis.themes = bestMoveResult.themes;
                    if (bestMoveResult.patterns && bestMoveResult.patterns.length > 0) {
                      bestLineAnalysis.positionContext = JSON.stringify(bestMoveResult.patterns);
                    }
                  }
                } catch (e) {
                  console.warn("Best line analysis failed for bulk:", e);
                }
              }

              // Filter: Blunder/Mistake OR Tactical Pattern
              if (
                pos.moveClassification === MoveClassification.Blunder ||
                pos.moveClassification === MoveClassification.Mistake ||
                (detailedPatterns.length > 0)
              ) {
                // Extract evaluations - same logic as useGameDatabase
                const prevLine = gameEval.positions[index - 1]?.lines?.[0];
                const currLine = pos.lines?.[0];
                
                let evalBefore: number | null = null;
                let evalAfter: number | null = null;
                
                // evalBefore from previous position's best line
                if (prevLine) {
                  if (prevLine.cp !== undefined) {
                    evalBefore = prevLine.cp;
                  } else if (prevLine.mate !== undefined) {
                    evalBefore = prevLine.mate > 0 ? 10000 : -10000;
                  }
                } else if (index === 0) {
                  // First move - starting position is roughly equal
                  evalBefore = 0;
                }
                
                // evalAfter from current position's best line  
                if (currLine) {
                  if (currLine.cp !== undefined) {
                    evalAfter = currLine.cp;
                  } else if (currLine.mate !== undefined) {
                    evalAfter = currLine.mate > 0 ? 10000 : -10000;
                  }
                }
                
                // Calculate evaluation difference
                let evalDiff: number | null = null;
                if (evalBefore !== null && evalAfter !== null) {
                  const isWhite = index % 2 === 0;
                  const rawDiff = evalAfter - evalBefore;
                  evalDiff = isWhite ? rawDiff : -rawDiff;
                }
                
                // Check if the played move is already the best move
                const isBestMove = moveSan === bestMoveSan;
                
                return {
                  ply: index, // Correct Index (Ply 1 is first move)
                  fen: positionFen, 
                  move: moveSan,
                  bestMove: pos.bestMove || undefined,
                  type: pos.moveClassification || "info",
                  
                  // Evaluation fields
                  evalBefore,
                  evalAfter,
                  evalDiff,
                  
                  // Player context
                  playerColor: (index % 2 === 0) ? "white" : "black",
                  isUserMove: game?.userColor ? game.userColor === ((index % 2 === 0) ? "white" : "black") : false,
                  bestLines: pos.lines || [],
                  multiPvLines: settings.engineMultiPv || 1,
                  
                  // Tactical context
                  positionContext: JSON.stringify((analysisResult as any).patterns || []),
                  tactical: analysisResult.tactical,
                  themes: analysisResult.themes,
                  // Store i18n key JSON (already in JSON format from describer)
                  description: analysisResult.description || JSON.stringify({ key: "Tactical.descriptions.generic", params: { move: moveSan } }),
                  
                  // Best line analysis - Store i18n key JSON
                  bestLineDescription: bestLineAnalysis.description || "",
                  bestLineTheme: bestLineAnalysis.themes || [],
                  bestLinePositionContext: JSON.stringify(bestLineAnalysis.patterns || []),
                  
                  // Global description - Don't show best move if it's the same as played move
                  globalDescription: [
                    analysisResult.description, 
                    (!isBestMove && bestLineAnalysis.description && bestLineAnalysis.description.trim())
                      ? `En jouant ${bestMoveSan}, ${bestLineAnalysis.description}` 
                      : (!isBestMove && bestMoveSan ? `Nous aurions pu jouer ${bestMoveSan}` : '')
                  ].filter(Boolean).join(' '),
                };
              }
              return null;
            })
            .filter(Boolean);

          const saveResponse = await fetch(
            `/api/games/${gameIds[i]}/analysis`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                // Full eval object for legacy support
                eval: gameEval,

                // Engine settings
                engineName: settings.engineName,
                engineDepth: settings.engineDepth,
                engineMultiPv: settings.engineMultiPv,

                // UI settings
                boardHue: settings.boardHue,
                pieceSet: settings.pieceSet,
                showBestMove: settings.showBestMove,
                showPlayerMove: settings.showPlayerMove,

                // Accuracy statistics
                whiteAccuracy: gameEval.accuracy?.white,
                blackAccuracy: gameEval.accuracy?.black,

                // Move quality counts - White
                whiteBrilliant: moveCounts.white.brilliant,
                whiteBest: moveCounts.white.best,
                whiteMistakes: moveCounts.white.mistake,
                whiteBlunders: moveCounts.white.blunder,

                // Move quality counts - Black
                blackBrilliant: moveCounts.black.brilliant,
                blackBest: moveCounts.black.best,
                blackMistakes: moveCounts.black.mistake,
                blackBlunders: moveCounts.black.blunder,

                // Opening information
                openingECO: openingECO,
                openingName: openingName,

                // Move evaluations array
                moveEvaluations: moveEvaluations,

                // Critical moments
                criticalMoments: criticalMoments,

                // Move counts
                movesCount: params.fens.length,

                // Mark for automatic AI analysis
                needsAiAnalysis: true,
                aiAnalysisQueuedAt: new Date().toISOString(),
              }),
            }
          );

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json().catch(() => ({}));
            console.error("Save error:", errorData);
            throw new Error(
              `Erreur lors de la sauvegarde de la partie ${gameIds[i]}`
            );
          }

          // Update progress: mark this game as complete
          setState((prev) => ({
            ...prev,
            currentGameProgress: 100,
          }));
        }

        // All done
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          currentGameIndex: gameIds.length,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        }));
      } finally {
        abortControllerRef.current = null;
      }
    },
    [getEngineByName]
  );

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      isAnalyzing: false,
      error: "Analyse annulée par l'utilisateur",
    }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      isAnalyzing: false,
      currentGameIndex: 0,
      totalGames: 0,
      currentGameProgress: 0,
      error: null,
    });
  }, []);

  return {
    state,
    analyzeGames,
    cancelAnalysis,
    resetState,
  };
}
