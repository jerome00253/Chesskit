import { Grid2 as Grid, Typography, Box } from "@mui/material";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAtomValue } from "jotai";
import { gameAtom, boardAtom } from "../states";
import { useTranslations, useLocale } from "next-intl";

/**
 * Traduit le nom de l'ouverture
 */

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
  const board = useAtomValue(boardAtom);
  const gameHeaders = game.getHeaders();
  const t = useTranslations("Analysis");
  const locale = useLocale();

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

  const formatDate = (dateValue: string | Date | undefined | null) => {
    if (!dateValue || dateValue === "?") return "?";
    try {
      const dateObj = new Date(dateValue);
      if (isNaN(dateObj.getTime())) return dateValue.toString();
      return dateObj.toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateValue.toString();
    }
  };

  // Logic to display Critical Moment description
  const currentPly = board.history().length;
  // ply in DB seems to be 0-based index of the move in the sequence
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentMoment = gameFromUrl?.criticalMoments?.find(
    (m: any) => m.ply === currentPly - 1
  );

  const description =
    locale === "fr"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (currentMoment as any)?.descriptionFr || currentMoment?.description
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (currentMoment as any)?.descriptionEn || currentMoment?.description;

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      rowGap={0.5}
      columnGap={2}
      size={12}
    >
      {/* Critical Moment Description */}
      {currentMoment && description && (
        <Grid container justifyContent="center" alignItems="center" size={12}>
          <Box
            sx={{
              border: 1,
              borderColor: "error.main",
              borderRadius: 1,
              px: 2,
              py: 0.5,
              bgcolor: "error.light",
              color: "error.contrastText",
              width: "100%",
              textAlign: "center",
              mb: 1,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              {description}
            </Typography>
          </Box>
        </Grid>
      )}

      <Grid container justifyContent="center" alignItems="center" size="grow">
        <Typography noWrap fontSize="0.9rem">
          {t("site")} : {gameFromUrl?.site || gameHeaders.Site || "?"}
        </Typography>
      </Grid>

      <Grid container justifyContent="center" alignItems="center" size="grow">
        <Typography noWrap fontSize="0.9rem">
          {t("date")} : {formatDate(gameFromUrl?.date || gameHeaders.Date)}
        </Typography>
      </Grid>

      <Grid container justifyContent="center" alignItems="center" size="grow">
        <Typography noWrap fontSize="0.9rem">
          {t("result")} : {result}
        </Typography>
      </Grid>
    </Grid>
  );
}
