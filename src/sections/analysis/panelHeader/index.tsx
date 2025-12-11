import { Icon } from "@iconify/react";
import { Grid2 as Grid, Typography } from "@mui/material";
import GamePanel from "./gamePanel";
import LoadGame from "./loadGame";
import AnalyzeButton from "./analyzeButton";
import EngineSelector from "./engineSelector";
import LinearProgressBar from "@/components/LinearProgressBar";
import { useAtomValue } from "jotai";
import { evaluationProgressAtom, gameEvalAtom } from "../states";
import { useTranslations, useLocale } from "next-intl";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { openingsFr } from "@/data/openings-fr";
import { useAnalysisSettings } from "@/hooks/useAnalysisSettings";
import { useEffect } from "react";

const translateOpening = (name: string, locale: string): string => {
  if (locale !== "fr") return name;
  // @ts-ignore
  return openingsFr[name] || name;
};

export default function PanelHeader() {
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const t = useTranslations("Analysis");
  const { gameFromUrl } = useGameDatabase();
  const locale = useLocale();
  const { restoreDefaults } = useAnalysisSettings();

  useEffect(() => {
    if (!gameFromUrl?.analyzed) {
      restoreDefaults();
    }
  }, [gameFromUrl, restoreDefaults]);

  const isLoadedFromDB = !!gameFromUrl?.analyzed;

  // Get stabilized opening (last one found)
  const analyzedOpeningName = gameEval?.positions
    ? [...gameEval.positions].reverse().find((p) => p.opening)?.opening
    : null;
  
  const displayOpening = analyzedOpeningName || gameFromUrl?.openingName;
  const translatedOpening = displayOpening ? translateOpening(displayOpening, locale) : "";

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      rowGap={2}
      size={12}
    >
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        columnGap={1}
        size={12}
      >
        <Icon icon="streamline:clipboard-check" height={24} />
        <Typography variant="h5" align="center">
          {t("title")}
          {isLoadedFromDB && (
            <Icon
              icon="mdi:database-check"
              height={20}
              style={{ marginLeft: 4, verticalAlign: "middle" }}
            />
          )}
        </Typography>
      </Grid>
      
      {/* Affichage de l'ouverture en Orange */}
      {translatedOpening && (
        <Grid container justifyContent="center" size={12}>
           <Typography variant="body1" color="warning.main" fontWeight="bold">
              {t("opening")} : {translatedOpening}
           </Typography>
        </Grid>
      )}

      <Grid
        container
        justifyContent="center"
        alignItems="center"
        rowGap={2}
        columnGap={2}
        size={12}
      >
        <GamePanel />
        <LoadGame />
        <EngineSelector />
        <AnalyzeButton />
        <LinearProgressBar value={evaluationProgress} label="Analyzing..." />
      </Grid>
    </Grid>
  );
}
