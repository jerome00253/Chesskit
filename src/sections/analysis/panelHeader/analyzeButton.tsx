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
} from "../states";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { getEvaluateGameParams } from "@/lib/chess";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { LoadingButton } from "@mui/lab";
import { useEngine } from "@/hooks/useEngine";
import { logAnalyticsEvent } from "@/lib/firebase";
import { SavedEvals } from "@/types/eval";
import { useEffect, useCallback } from "react";
import { usePlayersData } from "@/hooks/usePlayersData";
import { Typography } from "@mui/material";
import { useCurrentPosition } from "../hooks/useCurrentPosition";

import { useTranslations } from "next-intl";

export default function AnalyzeButton() {
  const t = useTranslations("Analysis");
  const engineName = useAtomValue(engineNameAtom);
  const engine = useEngine(engineName);
  useCurrentPosition(engine);
  const engineWorkersNb = useAtomValue(engineWorkersNbAtom);
  const [evaluationProgress, setEvaluationProgress] = useAtom(
    evaluationProgressAtom
  );
  const engineDepth = useAtomValue(engineDepthAtom);
  const engineMultiPv = useAtomValue(engineMultiPvAtom);
  const { setGameEval, gameFromUrl, loadGameAnalysis } = useGameDatabase();
  const [gameEval, setEval] = useAtom(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const setSavedEvals = useSetAtom(savedEvalsAtom);
  const { white, black } = usePlayersData(gameAtom);

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
      setGameEval(gameFromUrl.id, newGameEval, engineName, engineDepth);
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
  ]);

  useEffect(() => {
    setEvaluationProgress(0);
  }, [engine, setEvaluationProgress]);

  // Automatically load existing analysis or analyze when ready
  useEffect(() => {
    const loadOrAnalyze = async () => {
      // If gameFromUrl exists and is already analyzed, load from DB
      if (gameFromUrl?.analyzed && !gameEval) {
        const savedAnalysis = await loadGameAnalysis(gameFromUrl.id);
        if (savedAnalysis && savedAnalysis.eval) {
          // Convert loaded data to GameEval format and inject into state
          const loadedGameEval = savedAnalysis.eval as typeof gameEval;
          if (loadedGameEval) {
            setEval(loadedGameEval);
            return;
          }
        }
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
