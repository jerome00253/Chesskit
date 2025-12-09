import { useAtomValue } from "jotai";
import { Grid2 as Grid, Skeleton, Typography } from "@mui/material";
import { currentPositionAtom } from "../../states";
import { openingsFr } from "@/data/openings-fr";

import { useLocale } from "next-intl";

export default function Opening() {
  const position = useAtomValue(currentPositionAtom);
  const locale = useLocale();

  const lastMove = position?.lastMove;
  if (!lastMove) return null;

  const opening = position?.eval?.opening || position.opening;

  if (!opening) {
    return (
      <Grid justifyItems="center" alignContent="center">
        <Skeleton
          variant="rounded"
          animation="wave"
          width={"12em"}
          sx={{ color: "transparent", maxWidth: "7vw", maxHeight: "3.5vw" }}
        >
          <Typography align="center" fontSize="0.9rem">
            placeholder
          </Typography>
        </Skeleton>
      </Grid>
    );
  }

  return (
    <Grid>
      <Typography align="center" fontSize="0.9rem" maxWidth="20rem">
        {translateOpening(opening, locale)}
      </Typography>
    </Grid>
  );
}

/**
 * Traduit le nom d'une ouverture d'échecs
 * Utilise un dictionnaire pré-généré pour le français
 */
const translateOpening = (name: string, locale: string): string => {
  if (locale !== "fr") return name;

  // Utiliser le dictionnaire de traductions
  return openingsFr[name] || name;
};
