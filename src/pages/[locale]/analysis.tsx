import Board from "@/sections/analysis/board";
import PanelHeader from "@/sections/analysis/panelHeader";
import PanelToolBar from "@/sections/analysis/panelToolbar";
import AnalysisTab from "@/sections/analysis/panelBody/analysisTab";
import ClassificationTab from "@/sections/analysis/panelBody/classificationTab";
import {
  boardAtom,
  gameAtom,
  gameEvalAtom,
  engineNameAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  engineWorkersNbAtom,
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
  areAnalysisSettingsLoadedAtom,
} from "@/sections/analysis/states";
import {
  Box,
  Divider,
  Grid2 as Grid,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import EngineSettingsButton from "@/sections/engineSettings/engineSettingsButton";
import GraphTab from "@/sections/analysis/panelBody/graphTab";
import { PageTitle } from "@/components/pageTitle";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { AnalysisSettings } from "@/types/analysisSettings";
import { EngineName } from "@/types/enums";
import { boardHueAtom, pieceSetAtom } from "@/components/board/states";

export { getStaticPaths, getStaticProps };

export default function GameAnalysis() {
  const t = useTranslations("Index");
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const isLgOrGreater = useMediaQuery(theme.breakpoints.up("lg"));
  const { data: session } = useSession();

  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);

  // Atom setters for settings
  const setEngineName = useSetAtom(engineNameAtom);
  const setEngineDepth = useSetAtom(engineDepthAtom);
  const setEngineMultiPv = useSetAtom(engineMultiPvAtom);
  const setEngineWorkersNb = useSetAtom(engineWorkersNbAtom);
  const setShowBestMove = useSetAtom(showBestMoveArrowAtom);
  const setShowPlayerMove = useSetAtom(showPlayerMoveIconAtom);
  const setBoardHue = useSetAtom(boardHueAtom);
  const setPieceSet = useSetAtom(pieceSetAtom);
  const setAreSettingsLoaded = useSetAtom(areAnalysisSettingsLoadedAtom);

  const showMovesTab = game.history().length > 0 || board.history().length > 0;

  useEffect(() => {
    if (tab === 1 && !showMovesTab) setTab(0);
    if (tab === 2 && !gameEval) setTab(0);
  }, [showMovesTab, gameEval, tab]);

  // Load user analysis settings on mount
  useEffect(() => {
    if (!session) {
      setAreSettingsLoaded(true);
      return;
    }

    const loadSettings = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.analysisSettings) {
            const s = data.analysisSettings as AnalysisSettings;
            setEngineName(s.engineName as EngineName);
            setEngineDepth(s.depth);
            setEngineMultiPv(s.multiPv);
            setEngineWorkersNb(s.threads);
            setShowBestMove(s.showBestMove);
            setShowPlayerMove(s.showPlayerMove);
            setBoardHue(s.boardHue);
            setPieceSet(s.pieceSet as any);
          }
        }
      } catch (error) {
        console.error("Failed to load analysis settings:", error);
      } finally {
        setAreSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [
    session,
    setEngineName,
    setEngineDepth,
    setEngineMultiPv,
    setEngineWorkersNb,
    setShowBestMove,
    setShowPlayerMove,
    setBoardHue,
    setPieceSet,
    setAreSettingsLoaded,
  ]);

  return (
    <Grid container gap={4} justifyContent="space-evenly" alignItems="start">
      <PageTitle title={t("title")} />

      <Board />

      <Grid
        container
        justifyContent="start"
        alignItems="center"
        borderRadius={2}
        border={1}
        borderColor={"secondary.main"}
        sx={{
          backgroundColor: "secondary.main",
          borderColor: "primary.main",
          borderWidth: 2,
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
        padding={2}
        style={{
          maxWidth: "1200px",
        }}
        rowGap={1}
        height={{ xs: tab === 1 ? "40rem" : "auto", lg: "calc(95vh - 60px)" }}
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
        size={{
          xs: 12,
          lg: "grow",
        }}
      >
        {isLgOrGreater ? (
          <Box width="100%">
            <PanelHeader key="analysis-panel-header" />
            <Divider sx={{ marginX: "5%", marginTop: 1.5 }} />
          </Box>
        ) : (
          <PanelToolBar key="review-panel-toolbar" />
        )}

        {!isLgOrGreater && !gameEval && <Divider sx={{ marginX: "5%" }} />}
        {!isLgOrGreater && !gameEval && (
          <PanelHeader key="analysis-panel-header" />
        )}

        {!isLgOrGreater && (
          <Box
            width="95%"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              marginX: { sm: "5%", xs: undefined },
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, newValue) => setTab(newValue)}
              aria-label="basic tabs example"
              variant="fullWidth"
              sx={{ minHeight: 0 }}
            >
              <Tab
                label="Analysis"
                id="tab0"
                icon={<Icon icon="mdi:magnify" height={15} />}
                iconPosition="start"
                sx={{
                  textTransform: "none",
                  minHeight: 15,
                  padding: "5px 0em 12px",
                }}
                disableFocusRipple
              />

              <Tab
                label="Moves"
                id="tab1"
                icon={<Icon icon="mdi:format-list-bulleted" height={15} />}
                iconPosition="start"
                sx={{
                  textTransform: "none",
                  minHeight: 15,
                  display: showMovesTab ? undefined : "none",
                  padding: "5px 0em 12px",
                }}
                disableFocusRipple
              />

              <Tab
                label="Graph"
                id="tab2"
                icon={<Icon icon="mdi:chart-line" height={15} />}
                iconPosition="start"
                sx={{
                  textTransform: "none",
                  minHeight: 15,
                  display: gameEval ? undefined : "none",
                  padding: "5px 0em 12px",
                }}
                disableFocusRipple
              />
            </Tabs>
          </Box>
        )}

        <GraphTab
          role="tabpanel"
          hidden={tab !== 2 && !isLgOrGreater}
          id="tabContent2"
        />

        <AnalysisTab
          role="tabpanel"
          hidden={tab !== 0 && !isLgOrGreater}
          id="tabContent0"
        />

        <ClassificationTab
          role="tabpanel"
          hidden={tab !== 1 && !isLgOrGreater}
          id="tabContent1"
        />

        {isLgOrGreater && (
          <Box width="100%">
            <Divider sx={{ marginX: "5%", marginBottom: 1.5 }} />
            <PanelToolBar key="review-panel-toolbar" />
          </Box>
        )}

        {!isLgOrGreater && gameEval && (
          <Box width="100%">
            <Divider sx={{ marginX: "5%", marginBottom: 2.5 }} />
            <PanelHeader key="analysis-panel-header" />
          </Box>
        )}
      </Grid>

      <EngineSettingsButton />
    </Grid>
  );
}
