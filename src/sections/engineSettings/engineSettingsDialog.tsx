import Slider from "@/components/slider";
import { EngineName } from "@/types/enums";
import {
  MenuItem,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  OutlinedInput,
  DialogActions,
  Typography,
  Grid2 as Grid,
  Box,
  useTheme,
} from "@mui/material";
import {
  engineNameAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  engineWorkersNbAtom,
} from "../analysis/states";
import ArrowOptions from "./arrowOptions";

import { useEffect } from "react";
import { isEngineSupported } from "@/lib/engine/shared";
import { Stockfish16_1 } from "@/lib/engine/stockfish16_1";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { boardHueAtom, pieceSetAtom } from "@/components/board/states";
import Image from "next/image";
import { useAnalysisSettings } from "@/hooks/useAnalysisSettings";
import { ENGINE_LABELS, PIECE_SETS } from "@/constants";
import { getRecommendedWorkersNb } from "@/lib/engine/worker";
import { useEngines } from "@/hooks/useEngines";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EngineSettingsDialog({ open, onClose }: Props) {
  const { saveSettings } = useAnalysisSettings();
  const { engines } = useEngines();

  const handleClose = () => {
    saveSettings();
    onClose();
  };

  const [engineName, setEngineName] = useAtom(engineNameAtom);
  const [depth, setDepth] = useAtom(engineDepthAtom);
  const [multiPv, setMultiPv] = useAtom(engineMultiPvAtom);

  const [boardHue, setBoardHue] = useAtom(boardHueAtom);
  const [pieceSet, setPieceSet] = useAtom(pieceSetAtom);

  const [engineWorkersNb, setEngineWorkersNb] = useAtom(engineWorkersNbAtom);

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const t = useTranslations("Analysis");

  useEffect(() => {
    if (!isEngineSupported(engineName)) {
      if (Stockfish16_1.isSupported()) {
        setEngineName(EngineName.Stockfish16_1Lite);
      } else {
        setEngineName(EngineName.Stockfish11);
      }
    }
  }, [setEngineName, engineName]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableScrollLock
    >
      <DialogTitle variant="h5" sx={{ paddingBottom: 1 }}>
        {t("settings.title")}
      </DialogTitle>
      <DialogContent sx={{ paddingBottom: 0 }}>
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          paddingTop={1}
          spacing={3}
          size={12}
        >
          <Grid
            container
            justifyContent="center"
            size={{ xs: 12, sm: 7, md: 8 }}
          >
            <Typography variant="body2">
              {t("settings.engine_description")}
            </Typography>
          </Grid>

          <Grid
            container
            justifyContent="center"
            size={{ xs: 12, sm: 5, md: 4 }}
          >
            <FormControl variant="outlined">
              <InputLabel id="dialog-select-label">
                {t("settings.engine")}
              </InputLabel>
              <Select
                labelId="dialog-select-label"
                id="dialog-select"
                displayEmpty
                input={<OutlinedInput label={t("settings.engine")} />}
                value={
                  engines.some((e) => e.identifier === engineName)
                    ? engineName
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value as EngineName;
                  if (val) setEngineName(val);
                }}
                sx={{ width: 280, maxWidth: "100%" }}
              >
                {engines.map((engine) => {
                  const supported = isEngineSupported(engine.identifier);
                  return (
                    <MenuItem
                      key={engine.identifier}
                      value={engine.identifier}
                      disabled={!supported}
                    >
                      {engine.name}
                      {!supported && " (N/A)"}
                    </MenuItem>
                  );
                })}
                {!engines.some((e) => e.identifier === engineName) &&
                  engineName && (
                    <MenuItem value={engineName} disabled>
                      {engineName}
                    </MenuItem>
                  )}
              </Select>
            </FormControl>
          </Grid>

          <Slider
            label={t("settings.max_depth")}
            value={depth}
            setValue={setDepth}
            min={10}
            max={30}
            marksFilter={2}
          />

          <Slider
            label={t("settings.lines")}
            value={multiPv}
            setValue={setMultiPv}
            min={1}
            max={6}
            marksFilter={1}
            size={6}
          />

          <ArrowOptions />

          <Grid
            container
            justifyContent="center"
            size={{ xs: 12, sm: 8, md: 9 }}
          >
            <Slider
              label={t("settings.board_hue")}
              value={boardHue}
              setValue={setBoardHue}
              min={0}
              max={360}
            />
          </Grid>

          <Grid
            container
            justifyContent="center"
            alignItems="center"
            size={{ xs: 12, sm: 4, md: 3 }}
          >
            <FormControl variant="outlined">
              <InputLabel id="dialog-select-label">
                {t("settings.piece_set")}
              </InputLabel>
              <Select
                labelId="dialog-select-label"
                id="dialog-select"
                displayEmpty
                input={<OutlinedInput label={t("settings.piece_set")} />}
                value={pieceSet}
                onChange={(e) =>
                  setPieceSet(e.target.value as (typeof PIECE_SETS)[number])
                }
                sx={{ width: 200, maxWidth: "100%" }}
              >
                {PIECE_SETS.map((name) => (
                  <MenuItem key={name} value={name}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Image
                        loading="lazy"
                        src={`/piece/${name}/${isDarkMode ? "w" : "b"}N.svg`}
                        alt={`${name} knight`}
                        width={24}
                        height={24}
                      />
                      {name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid
            container
            justifyContent="center"
            alignItems="center"
            size={{ xs: 12, md: 11 }}
          >
            <Slider
              label={t("settings.threads")}
              value={engineWorkersNb}
              setValue={setEngineWorkersNb}
              min={1}
              max={12}
              marksFilter={1}
              infoContent={
                <>
                  {t("settings.threads_info", {
                    threads: getRecommendedWorkersNb(),
                  })}
                </>
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ m: 1 }}>
        <Button variant="contained" onClick={handleClose}>
          {t("settings.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
