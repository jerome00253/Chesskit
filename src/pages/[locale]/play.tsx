import { PageTitle } from "@/components/pageTitle";
import Board from "@/sections/play/board";
import GameInProgress from "@/sections/play/gameInProgress";
import GameRecap from "@/sections/play/gameRecap";
import GameSettingsButton from "@/sections/play/gameSettings/gameSettingsButton";
import { isGameInProgressAtom } from "@/sections/play/states";
import { boardHueAtom, pieceSetAtom } from "@/components/board/states";
import {
  engineNameAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  engineWorkersNbAtom,
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
} from "@/sections/analysis/states";
import { Grid2 as Grid } from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { AnalysisSettings } from "@/types/analysisSettings";
import { EngineName } from "@/types/enums";

export { getStaticPaths, getStaticProps };

export default function Play() {
  const t = useTranslations("Play");
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const { data: session } = useSession();

  const setBoardHue = useSetAtom(boardHueAtom);
  const setPieceSet = useSetAtom(pieceSetAtom);
  const setEngineName = useSetAtom(engineNameAtom);
  const setEngineDepth = useSetAtom(engineDepthAtom);
  const setEngineMultiPv = useSetAtom(engineMultiPvAtom);
  const setEngineWorkersNb = useSetAtom(engineWorkersNbAtom);
  const setShowBestMove = useSetAtom(showBestMoveArrowAtom);
  const setShowPlayerMove = useSetAtom(showPlayerMoveIconAtom);

  // Load user's analysis settings on mount
  useEffect(() => {
    if (!session) return;

    const loadSettings = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.analysisSettings) {
            const settings = data.analysisSettings as AnalysisSettings;
            setBoardHue(settings.boardHue);
            setPieceSet(settings.pieceSet as any);
            setEngineName(settings.engineName as EngineName);
            setEngineDepth(settings.depth);
            setEngineMultiPv(settings.multiPv);
            setEngineWorkersNb(settings.threads);
            setShowBestMove(settings.showBestMove);
            setShowPlayerMove(settings.showPlayerMove);
          }
        }
      } catch (error) {
        console.error("Failed to load analysis settings:", error);
      }
    };

    loadSettings();
  }, [
    session,
    setBoardHue,
    setPieceSet,
    setEngineName,
    setEngineDepth,
    setEngineMultiPv,
    setEngineWorkersNb,
    setShowBestMove,
    setShowPlayerMove,
  ]);

  return (
    <Grid container gap={4} justifyContent="space-evenly" alignItems="start">
      <PageTitle title={t("title")} />

      <Board />

      <Grid
        container
        marginTop={{ xs: 0, md: "2.5em" }}
        justifyContent="center"
        alignItems="center"
        borderRadius={2}
        border={1}
        borderColor={"secondary.main"}
        size={{
          xs: 12,
          md: "grow",
        }}
        sx={{
          backgroundColor: "secondary.main",
          borderColor: "primary.main",
          borderWidth: 2,
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
        padding={3}
        rowGap={3}
        style={{
          maxWidth: "400px",
        }}
      >
        <GameInProgress />
        {!isGameInProgress && <GameSettingsButton />}
        <GameRecap />
      </Grid>
    </Grid>
  );
}
