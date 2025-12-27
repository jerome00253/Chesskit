import { useAtom } from "jotai";
import {
  engineNameAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  engineWorkersNbAtom,
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
} from "@/sections/analysis/states";
import { boardHueAtom, pieceSetAtom } from "@/components/board/states";
import { useCallback } from "react";

export const useAnalysisSettings = () => {
  const [engineName, setEngineName] = useAtom(engineNameAtom);
  const [engineDepth, setEngineDepth] = useAtom(engineDepthAtom);
  const [engineMultiPv, setEngineMultiPv] = useAtom(engineMultiPvAtom);
  const [engineWorkersNb, setEngineWorkersNb] = useAtom(engineWorkersNbAtom);
  const [showBestMove, setShowBestMove] = useAtom(showBestMoveArrowAtom);
  const [showPlayerMove, setShowPlayerMove] = useAtom(showPlayerMoveIconAtom);
  const [boardHue, setBoardHue] = useAtom(boardHueAtom);
  const [pieceSet, setPieceSet] = useAtom(pieceSetAtom);

  const saveSettings = useCallback(async () => {
    try {
      const settings = {
        engineName,
        engineDepth,
        engineMultiPv,
        engineWorkersNb,
        showBestMove,
        showPlayerMove,
        boardHue,
        pieceSet,
      };
      await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  }, [
    engineName,
    engineDepth,
    engineMultiPv,
    engineWorkersNb,
    showBestMove,
    showPlayerMove,
    boardHue,
    pieceSet,
  ]);

  const restoreDefaults = useCallback(async () => {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const settings = await res.json();
        if (settings.engineName) setEngineName(settings.engineName);
        if (settings.engineDepth) setEngineDepth(settings.engineDepth);
        if (settings.engineMultiPv) setEngineMultiPv(settings.engineMultiPv);
        if (settings.engineWorkersNb)
          setEngineWorkersNb(settings.engineWorkersNb);
        if (settings.showBestMove !== undefined)
          setShowBestMove(settings.showBestMove);
        if (settings.showPlayerMove !== undefined)
          setShowPlayerMove(settings.showPlayerMove);
        if (settings.boardHue !== undefined) setBoardHue(settings.boardHue);
        if (settings.pieceSet) setPieceSet(settings.pieceSet);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    }
  }, [
    setEngineName,
    setEngineDepth,
    setEngineMultiPv,
    setEngineWorkersNb,
    setShowBestMove,
    setShowPlayerMove,
    setBoardHue,
    setPieceSet,
  ]);

  return { saveSettings, restoreDefaults };
};
