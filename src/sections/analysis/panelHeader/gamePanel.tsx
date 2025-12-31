import { Grid2 as Grid, Typography } from "@mui/material";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAtomValue } from "jotai";
import { gameAtom, boardAtom } from "../states";
import { useTranslations, useLocale } from "next-intl";
import TacticalCommentBubble from "@/components/analysis/TacticalCommentBubble";
import { useSession } from "next-auth/react";

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
  const board = useAtomValue(boardAtom);
  const gameFromAtom = useAtomValue(gameAtom); // Renamed to avoid conflict with gameFromUrl from hook
  const gameHeaders = gameFromAtom?.getHeaders() || {}; // Use headers from the atom if available, otherwise empty object
  const t = useTranslations("Analysis");
  const { data: session } = useSession();
  const locale = useLocale(); // Added locale for formatDate
  const analysisSettings = (session?.user as any)?.analysisSettings;
  const showComments = analysisSettings?.showComments !== false;

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
  const currentMoment = gameFromUrl?.criticalMoments?.find(
    (m: any) => m.ply === currentPly
  );

  // Description is now handled by TacticalCommentBubble component



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
      {currentMoment && showComments && (
        <Grid container justifyContent="center" alignItems="center" size={12}>
          <TacticalCommentBubble
            moveType={currentMoment.type}
            playedMoveDescription={currentMoment.description}
            bestMoveDescription={currentMoment.bestLineDescription}
            themes={currentMoment.themes}
            move={currentMoment.move}
            bestMove={(currentMoment as any).bestMoveSan || (currentMoment as any).bestMove}
          />
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
