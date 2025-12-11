import { Checkbox, FormControlLabel, Grid2 as Grid } from "@mui/material";
import {
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
} from "../analysis/states";
import { useTranslations } from "next-intl";
import { useAtom } from "jotai";

export default function ArrowOptions() {
  const [showBestMove, setShowBestMove] = useAtom(showBestMoveArrowAtom);
  const [showPlayerMoveIcon, setShowPlayerMoveIcon] = useAtom(
    showPlayerMoveIconAtom
  );
  const t = useTranslations("Analysis");

  return (
    <Grid
      container
      justifyContent="space-evenly"
      alignItems="center"
      size={12}
      gap={3}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={showBestMove}
            onChange={(_, checked) => setShowBestMove(checked)}
          />
        }
        label={t("settings.show_best_move")}
        sx={{ marginX: 0 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={showPlayerMoveIcon}
            onChange={(_, checked) => setShowPlayerMoveIcon(checked)}
          />
        }
        label={t("settings.show_played_move")}
        sx={{ marginX: 0 }}
      />
    </Grid>
  );
}
