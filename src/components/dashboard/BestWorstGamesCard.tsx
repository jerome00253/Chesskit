import { Card, CardContent, Typography, Grid2 as Grid, Chip, Link as MuiLink } from "@mui/material";
import { Icon } from "@iconify/react";
import { Game } from "@/types/game";
import Link from "next/link";
import { useRouter } from "next/router";

interface BestWorstGamesCardProps {
  bestVictory: {
    game: Game;
    opponent: string;
    opponentRating: number;
    ratingDiff: number;
  } | null;
  worstDefeat: {
    game: Game;
    opponent: string;
    opponentRating: number;
    ratingDiff: number;
  } | null;
}

export function BestWorstGamesCard({ bestVictory, worstDefeat }: BestWorstGamesCardProps) {
  const router = useRouter();
  const locale = router.query.locale || "fr";

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🏆 Performances Remarquables
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Best Victory */}
          <Grid size={6}>
            <Typography variant="subtitle2" color="success.main" gutterBottom>
              <Icon icon="mdi:trophy" style={{ marginRight: 4, verticalAlign: "middle" }} />
              Meilleure Victoire
            </Typography>
            {bestVictory ? (
              <>
                <Typography variant="body2">
                  <strong>{bestVictory.opponent}</strong>
                </Typography>
                <Chip
                  label={`Elo: ${bestVictory.opponentRating}`}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Différence: <span style={{ color: "green" }}>+{bestVictory.ratingDiff}</span>
                </Typography>
                <Typography variant="caption" display="block">
                  {bestVictory.game.date}
                </Typography>
                <Link href={`/${locale}/analysis?gameId=${bestVictory.game.id}`} passHref legacyBehavior>
                  <MuiLink variant="caption" sx={{ cursor: "pointer" }}>
                    <Icon icon="mdi:eye" style={{ marginRight: 2, verticalAlign: "middle" }} />
                    Voir la partie
                  </MuiLink>
                </Link>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucune victoire cette année
              </Typography>
            )}
          </Grid>

          {/* Worst Defeat */}
          <Grid size={6}>
            <Typography variant="subtitle2" color="error.main" gutterBottom>
              <Icon icon="mdi:alert-circle" style={{ marginRight: 4, verticalAlign: "middle" }} />
              Pire Défaite
            </Typography>
            {worstDefeat ? (
              <>
                <Typography variant="body2">
                  <strong>{worstDefeat.opponent}</strong>
                </Typography>
                <Chip
                  label={`Elo: ${worstDefeat.opponentRating}`}
                  size="small"
                  color="error"
                  sx={{ mt: 0.5 }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Différence: <span style={{ color: "red" }}>{worstDefeat.ratingDiff}</span>
                </Typography>
                <Typography variant="caption" display="block">
                  {worstDefeat.game.date}
                </Typography>
                <Link href={`/${locale}/analysis?gameId=${worstDefeat.game.id}`} passHref legacyBehavior>
                  <MuiLink variant="caption" sx={{ cursor: "pointer" }}>
                    <Icon icon="mdi:eye" style={{ marginRight: 2, verticalAlign: "middle" }} />
                    Voir la partie
                  </MuiLink>
                </Link>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucune défaite cette année
              </Typography>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
