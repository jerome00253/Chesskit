import { Grid2 as Grid, Typography } from "@mui/material";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAtomValue } from "jotai";
import { gameAtom } from "../states";
import { useTranslations } from "next-intl";

/**
 * Traduit les messages de terminaison de partie
 */
const translateTermination = (
  termination: string,
  t: (key: string, values?: Record<string, string>) => string
): string => {
  // Patterns de terminaison à traduire
  const patterns = [
    {
      regex: /^(.+) won by checkmate$/i,
      key: "termination.won_by_checkmate",
    },
    {
      regex: /^(.+) won by resignation$/i,
      key: "termination.won_by_resignation",
    },
    {
      regex: /^Draw by stalemate$/i,
      key: "termination.draw_by_stalemate",
    },
    {
      regex: /^Draw by insufficient material$/i,
      key: "termination.draw_by_insufficient_material",
    },
    {
      regex: /^Draw by threefold repetition$/i,
      key: "termination.draw_by_threefold_repetition",
    },
    {
      regex: /^Draw by fifty-move rule$/i,
      key: "termination.draw_by_fifty_move_rule",
    },
  ];

  // Chercher le pattern correspondant
  for (const pattern of patterns) {
    const match = termination.match(pattern.regex);
    if (match) {
      // Si le pattern contient un nom de gagnant
      if (match[1]) {
        return t(pattern.key, { winner: match[1] });
      }
      // Sinon, juste traduire
      return t(pattern.key);
    }
  }

  // Si aucun pattern ne correspond, retourner le message original
  return termination;
};

export default function GamePanel() {
  const { gameFromUrl } = useGameDatabase();
  const game = useAtomValue(gameAtom);
  const gameHeaders = game.getHeaders();
  const t = useTranslations("Analysis");

  const hasGameInfo =
    gameFromUrl !== undefined ||
    (!!gameHeaders.White && gameHeaders.White !== "?");

  if (!hasGameInfo) return null;

  const termination =
    gameFromUrl?.termination || gameHeaders.Termination || "?";
  const result =
    termination.split(" ").length > 2
      ? translateTermination(termination, t)
      : gameFromUrl?.result || gameHeaders.Result || "?";
  // Opening information (ECO and name) from DB or PGN headers
  const openingECO = gameFromUrl?.openingECO || gameHeaders.ECO || "";
  const openingName = gameFromUrl?.openingName || gameHeaders.Opening || "";

  return (
    <Grid
      container
      justifyContent="space-evenly"
      alignItems="center"
      rowGap={1}
      columnGap={3}
      size={11}
    >
      <Grid container justifyContent="center" alignItems="center" size="grow">
        <Typography noWrap fontSize="0.9rem">
          {t("site")} : {gameFromUrl?.site || gameHeaders.Site || "?"}
        </Typography>
      </Grid>

      <Grid container justifyContent="center" alignItems="center" size="grow">
        <Typography noWrap fontSize="0.9rem">
          {t("date")} : {gameFromUrl?.date || gameHeaders.Date || "?"}
        </Typography>
      </Grid>

      <Grid container justifyContent="center" alignItems="center" size="grow">
        <Typography noWrap fontSize="0.9rem">
          {t("result")} : {result}
        </Typography>
      </Grid>

      {/* Opening information */}
      {(openingECO || openingName) && (
        <Grid container justifyContent="center" alignItems="center" size="grow">
          <Typography noWrap fontSize="0.9rem">
            {t("opening")} : {openingECO && `${openingECO} `}{openingName}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
}
