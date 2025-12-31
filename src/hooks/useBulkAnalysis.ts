import { useState, useCallback, useRef, useEffect } from "react";
import { EngineName, MoveClassification } from "@/types/enums";
import { Chess } from "chess.js";
import type { GameEval } from "@/types/eval";
import { getEvaluateGameParams } from "@/lib/chess";
import { useEngine } from "@/hooks/useEngine";
import { fetchLichessOpening } from "@/lib/lichess";
import { identifyOpening } from "@/lib/opening";
import { buildCriticalMoments } from "@/lib/criticalMomentBuilder";
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

  // Dynamic engine name tracked via state
  const [currentEngineName, setCurrentEngineName] = useState<string | undefined>(undefined);
  const engine = useEngine(currentEngineName);

  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Track pending analysis request
  const pendingAnalysisRef = useRef<{gameIds: number[], settings: BulkAnalysisSettings} | null>(null);

  // Effect to run analysis when engine becomes ready
  useEffect(() => {
    if (pendingAnalysisRef.current && engine?.getIsReady()) {
      const { gameIds, settings } = pendingAnalysisRef.current;
      pendingAnalysisRef.current = null;
      runAnalysis(gameIds, settings);
    }
  }, [engine]);

  const analyzeGames = useCallback(
    async (gameIds: number[], settings: BulkAnalysisSettings) => {
      // Set engine name from settings - this triggers useEngine to load the right engine
      setCurrentEngineName(settings.engineName);

      // Reset state
      setState({
        isAnalyzing: true,
        currentGameIndex: 0,
        totalGames: gameIds.length,
        currentGameProgress: 0,
        error: null,
      });

      abortControllerRef.current = new AbortController();

      // If engine is already ready, run immediately
      if (engine?.getIsReady()) {
        runAnalysis(gameIds, settings);
      } else {
        // Store request for when engine is ready
        pendingAnalysisRef.current = { gameIds, settings };
      }
    },
    [engine]
  );

  const runAnalysis = useCallback(
    async (gameIds: number[], settings: BulkAnalysisSettings) => {
      if (!engine?.getIsReady()) {
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: `Engine ${settings.engineName} not ready. Please ensure the engine is loaded.`,
        }));
        return;
      }

      try {
        for (let i = 0; i < gameIds.length; i++) {
          // Check if cancelled
          if (abortControllerRef.current?.signal.aborted) {
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

          // Identify critical moments using shared builder function
          // Note: gameEval.positions[0] is the starting position eval (should be skipped)
          // gameEval.positions[1] is the eval after first move, which corresponds to sanMoves[0]
          // params.fens[0] is the starting position, params.fens[1] is after first move
          // After slicing positions[1:], we have: slicedPositions[0] = first move eval
          // Which should use: fenBefore = fens[0] (start), fenAfter = fens[1], move = sanMoves[0]
          const criticalMoments = buildCriticalMoments({
            positions: gameEval.positions.slice(1), // Skip starting position eval
            fens: params.fens, // Keep as-is: fens[0] = start, fens[idx+1] = after move idx
            moves: sanMoves,
            userColor: game?.userColor,
            multiPv: settings.engineMultiPv,
          });

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
            console.error("[BULK ANALYSIS] Save error:", errorData);
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
    [engine, games]
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
