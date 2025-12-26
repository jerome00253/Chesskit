import { useAtomValue } from "jotai";
import { gameAtom, isGameInProgressAtom, playerColorAtom } from "./states";
import { Button, Grid2 as Grid, Typography } from "@mui/material";
import { Color } from "@/types/enums";
import { setGameHeaders } from "@/lib/chess";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";

export default function GameRecap() {
  const game = useAtomValue(gameAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const { addGame } = useGameDatabase();
  const router = useRouter();
  const t = useTranslations("Play");

  if (isGameInProgress || !game.history().length) return null;

  const getResultLabel = () => {
    if (game.isCheckmate()) {
      const winnerColor = game.turn() === "w" ? Color.Black : Color.White;
      const winnerLabel =
        winnerColor === playerColor ? t("result.you") : t("result.opponent");
      return t("result.won_by_checkmate", { winner: winnerLabel });
    }
    if (game.isInsufficientMaterial())
      return t("result.draw_insufficient_material");
    if (game.isStalemate()) return t("result.draw_stalemate");
    if (game.isThreefoldRepetition()) return t("result.draw_repetition");
    if (game.isDraw()) return t("result.draw_fifty_move");

    return t("result.resigned");
  };

  const handleOpenGameAnalysis = async () => {
    const gameToAnalysis = setGameHeaders(game, {
      resigned: !game.isGameOver() ? playerColor : undefined,
    });
    const gameId = await addGame(
      gameToAnalysis,
      playerColor === Color.White ? "white" : "black"
    );

    const locale = router.query.locale || "en";
    router.push({ pathname: `/${locale}/`, query: { gameId } });
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      gap={2}
      size={12}
    >
      <Grid container justifyContent="center" size={12}>
        <Typography>{getResultLabel()}</Typography>
      </Grid>

      <Button variant="outlined" onClick={handleOpenGameAnalysis}>
        {t("open_game_analysis")}
      </Button>
    </Grid>
  );
}
