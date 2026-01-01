import { useAtomValue } from "jotai";
import { gameAtom, isGameInProgressAtom, playerColorAtom, engineEloAtom } from "./states";
import { Button, Grid2 as Grid, Typography } from "@mui/material";
import { Color } from "@/types/enums";
import { setGameHeaders } from "@/lib/chess";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useSession } from "next-auth/react";

export default function GameRecap() {
  const game = useAtomValue(gameAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const { addGame } = useGameDatabase();
  const router = useRouter();
  const t = useTranslations("Play");
  const engineElo = useAtomValue(engineEloAtom);
  const [eloChange, setEloChange] = useState<number | null>(null);
  const hasUpdatedElo = useRef(false);
  const { update } = useSession();

  useEffect(() => {
    // Only update once when the component mounts (which happens when game ends)
    if (isGameInProgress || !game.isGameOver() || hasUpdatedElo.current) return;

    const updateElo = async () => {
        hasUpdatedElo.current = true;
        
        let result = 0.5;
        if (game.isCheckmate()) {
            const winnerColor = game.turn() === "w" ? Color.Black : Color.White;
            result = winnerColor === playerColor ? 1 : 0;
        } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
            result = 0.5;
        } else {
            result = 0; // Player lost
        }

        try {
            const response = await fetch("/api/user/update-elo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    result,
                    opponentElo: engineElo,
                }),
            });
            
            if (response.ok) {
                const data = await response.json();
                setEloChange(data.newElo - data.oldElo);
                // Trigger live session update
                await update({ rating: data.newElo });
            }
        } catch (error) {
            console.error("Failed to update ELO", error);
        }
    };

    updateElo();
  }, [game, isGameInProgress, engineElo, playerColor]);

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
      <Grid container justifyContent="center" size={12} flexDirection="column" alignItems="center">
        <Typography>{getResultLabel()}</Typography>
        {eloChange !== null && (
             <Typography variant="caption" color={eloChange >= 0 ? "success.main" : "error.main"}>
                ELO: {eloChange > 0 ? "+" : ""}{eloChange}
             </Typography>
        )}
      </Grid>

      <Button variant="outlined" onClick={handleOpenGameAnalysis}>
        {t("open_game_analysis")}
      </Button>
    </Grid>
  );
}
