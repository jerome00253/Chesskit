import { Icon } from "@iconify/react";
import {
  engineDepthAtom,
  engineMultiPvAtom,
  engineNameAtom,
  engineWorkersNbAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
  savedEvalsAtom,
  debugStatusAtom,
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
  areAnalysisSettingsLoadedAtom,
} from "../states";
import { boardHueAtom, pieceSetAtom } from "@/components/board/states";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { getEvaluateGameParams } from "@/lib/chess";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { LoadingButton } from "@mui/lab";
import { useEngine } from "@/hooks/useEngine";
import { logAnalyticsEvent } from "@/lib/firebase";
import { SavedEvals, GameEval, PositionEval } from "@/types/eval";
import { useEffect, useCallback } from "react";
import { usePlayersData } from "@/hooks/usePlayersData";
import { Typography } from "@mui/material";
import { useCurrentPosition } from "../hooks/useCurrentPosition";

import { useTranslations } from "next-intl";

export default function AnalyzeButton() {
  const t = useTranslations("Analysis");
  const [engineName, setEngineName] = useAtom(engineNameAtom);
  const engine = useEngine(engineName);
  useCurrentPosition(engine);
  const engineWorkersNb = useAtomValue(engineWorkersNbAtom);
  const [evaluationProgress, setEvaluationProgress] = useAtom(
    evaluationProgressAtom
  );
  const engineDepth = useAtomValue(engineDepthAtom);
  const [engineMultiPv, setMultiPv] = useAtom(engineMultiPvAtom);
  const [boardHue, setBoardHue] = useAtom(boardHueAtom);
  const [pieceSet, setPieceSet] = useAtom(pieceSetAtom);
  const [showBestMove, setShowBestMove] = useAtom(showBestMoveArrowAtom);
  const [showPlayerMove, setShowPlayerMove] = useAtom(showPlayerMoveIconAtom);
  const { setGameEval, gameFromUrl, loadGameAnalysis } = useGameDatabase();
  const [gameEval, setEval] = useAtom(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const setSavedEvals = useSetAtom(savedEvalsAtom);
  const { white, black } = usePlayersData(gameAtom);
  const [, setDebugStatus] = useAtom(debugStatusAtom);
  const areSettingsLoaded = useAtomValue(areAnalysisSettingsLoadedAtom);

  const readyToAnalyse =
    engine?.getIsReady() && game.history().length > 0 && !evaluationProgress;

  const handleAnalyze = useCallback(async () => {
    const params = getEvaluateGameParams(game);
    if (
      !engine?.getIsReady() ||
      params.fens.length === 0 ||
      evaluationProgress
    ) {
      return;
    }

    const newGameEval = await engine.evaluateGame({
      ...params,
      depth: engineDepth,
      multiPv: engineMultiPv,
      setEvaluationProgress,
      playersRatings: {
        white: white?.rating,
        black: black?.rating,
      },
      workersNb: engineWorkersNb,
    });

    setEval(newGameEval);
    setEvaluationProgress(0);

    if (gameFromUrl) {
      setGameEval(gameFromUrl.id, newGameEval, engineName, engineDepth, {
        multiPv: engineMultiPv,
        showBestMove,
        showPlayerMove,
        boardHue,
        pieceSet,
      }, {
        fens: params.fens,
        moves: params.sanMoves,
      });
    }

    const gameSavedEvals: SavedEvals = params.fens.reduce((acc, fen, idx) => {
      acc[fen] = { ...newGameEval.positions[idx], engine: engineName };
      return acc;
    }, {} as SavedEvals);
    setSavedEvals((prev) => ({
      ...prev,
      ...gameSavedEvals,
    }));

    logAnalyticsEvent("analyze_game", {
      engine: engineName,
      depth: engineDepth,
      multiPv: engineMultiPv,
      nbPositions: params.fens.length,
    });
  }, [
    engine,
    engineName,
    engineWorkersNb,
    game,
    engineDepth,
    engineMultiPv,
    evaluationProgress,
    setEvaluationProgress,
    setEval,
    gameFromUrl,
    setGameEval,
    setSavedEvals,
    white.rating,
    black.rating,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  useEffect(() => {
    setEvaluationProgress(0);
  }, [engine, setEvaluationProgress]);

  // Automatically load existing analysis or analyze when ready
  useEffect(() => {
    const loadOrAnalyze = async () => {
      if (!areSettingsLoaded) return;
      // If gameFromUrl exists and is already analyzed, load from DB
      if (gameFromUrl?.analyzed && !gameEval) {
        setDebugStatus("Loading...");
        const savedAnalysis = await loadGameAnalysis(gameFromUrl.id);

        if (!savedAnalysis) {
          setDebugStatus("Failed: No SavedAnalysis");
          return;
        }
        if (!savedAnalysis.eval) {
          setDebugStatus("Failed: No Eval field");
          return;
        }

        if (savedAnalysis && savedAnalysis.eval) {
          // Convert loaded data to GameEval format and inject into state
          const loadedGameEval = savedAnalysis.eval as GameEval;

          if (!loadedGameEval.positions) {
            setDebugStatus("Failed: No Positions");
            // Emergency fallback if positions missing?
          }

          if (loadedGameEval && loadedGameEval.positions) {
            setDebugStatus("Merging...");
            // Sync engine name
            if (savedAnalysis.engineName) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setEngineName(savedAnalysis.engineName as any);
            }
            // Sync settings
            if (savedAnalysis.engineMultiPv)
              setMultiPv(savedAnalysis.engineMultiPv);
            if (
              savedAnalysis.boardHue !== undefined &&
              savedAnalysis.boardHue !== null
            )
              setBoardHue(savedAnalysis.boardHue);
            if (savedAnalysis.pieceSet) setPieceSet(savedAnalysis.pieceSet);
            if (
              savedAnalysis.showBestMove !== undefined &&
              savedAnalysis.showBestMove !== null
            )
              setShowBestMove(savedAnalysis.showBestMove);
            if (
              savedAnalysis.showPlayerMove !== undefined &&
              savedAnalysis.showPlayerMove !== null
            )
              setShowPlayerMove(savedAnalysis.showPlayerMove);
            // Merge moveEvaluations classifications into positions
            if (
              savedAnalysis.moveEvaluations &&
              Array.isArray(savedAnalysis.moveEvaluations)
            ) {
              loadedGameEval.positions = loadedGameEval.positions.map(
                (pos: PositionEval, index: number) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const moveEval = savedAnalysis.moveEvaluations.find(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (me: any) => me.ply === index
                  );
                  if (moveEval) {
                    const updatedPos = { ...pos };
                    if (moveEval.classification) {
                      updatedPos.moveClassification = moveEval.classification;
                    }
                    // Reconstruct lines if missing, using valid LineEval structure
                    if (!updatedPos.lines || updatedPos.lines.length === 0) {
                      updatedPos.lines = [
                        {
                          pv: [], // PV not strictly needed for graph, but required by type
                          cp: moveEval.score ?? undefined,
                          mate: moveEval.mateIn ?? undefined,
                          depth: moveEval.depth ?? 0,
                          multiPv: 1,
                        },
                      ];
                    }
                    return updatedPos;
                  }
                  return pos;
                }
              );
            }
            setEval(loadedGameEval);
            setDebugStatus("Success: SetEval Done");
            return;
          }
        }
      } else if (!gameFromUrl?.analyzed) {
        setDebugStatus("Skipped: Not Analyzed");
      }

      // Check if we can start new analysis
      const canAnalyze =
        gameFromUrl !== undefined ||
        (typeof window !== "undefined" &&
          !new URLSearchParams(window.location.search).has("gameId"));

      // Only auto-analyze if no existing analysis
      if (!gameEval && readyToAnalyse && canAnalyze && !gameFromUrl?.analyzed) {
        handleAnalyze();
      }
    };

    loadOrAnalyze();
  }, [
    gameEval,
    readyToAnalyse,
    handleAnalyze,
    gameFromUrl,
    loadGameAnalysis,
    setEval,
    setDebugStatus,
    areSettingsLoaded,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  if (evaluationProgress) return null;

  return (
    <LoadingButton
      variant="contained"
      size="small"
      startIcon={<Icon icon="streamline:magnifying-glass-solid" height={12} />}
      onClick={handleAnalyze}
      disabled={!readyToAnalyse}
    >
      <Typography fontSize="0.9em" fontWeight="500" lineHeight="1.4em">
        {gameEval ? t("analyze_again") : t("analyze_button")}
      </Typography>
    </LoadingButton>
  );
}
