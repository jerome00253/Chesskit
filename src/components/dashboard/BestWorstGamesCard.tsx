import { Card, CardContent, Typography, Grid2 as Grid, Chip, Link as MuiLink } from "@mui/material";
import { Icon } from "@iconify/react";
import { Game } from "@/types/game";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";

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
  const locale = router.query.locale || "en";
  const t = useTranslations("Dashboard");

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🏆 {t("YearlyStats.performances_title")}
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Best Victory */}
          <Grid size={6}>
            <Typography variant="subtitle2" color="success.main" gutterBottom>
              <Icon icon="mdi:trophy" style={{ marginRight: 4, verticalAlign: "middle" }} />
              {t("YearlyStats.best_victory")}
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
                  {t("YearlyStats.rating_diff", { diff: "+" + bestVictory.ratingDiff })}
                </Typography>
                <Typography variant="caption" display="block">
                  {bestVictory.game.date}
                </Typography>
                <Link href={`/${locale}/analysis?gameId=${bestVictory.game.id}`} passHref legacyBehavior>
                  <MuiLink variant="caption" sx={{ cursor: "pointer" }}>
                    <Icon icon="mdi:eye" style={{ marginRight: 2, verticalAlign: "middle" }} />
                    {t("YearlyStats.view_game")}
                  </MuiLink>
                </Link>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t("YearlyStats.no_victory")}
              </Typography>
            )}
          </Grid>

          {/* Worst Defeat */}
          <Grid size={6}>
            <Typography variant="subtitle2" color="error.main" gutterBottom>
              <Icon icon="mdi:alert-circle" style={{ marginRight: 4, verticalAlign: "middle" }} />
              {t("YearlyStats.worst_defeat")}
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
                  {t("YearlyStats.rating_diff", { diff: worstDefeat.ratingDiff })}
                </Typography>
                <Typography variant="caption" display="block">
                  {worstDefeat.game.date}
                </Typography>
                <Link href={`/${locale}/analysis?gameId=${worstDefeat.game.id}`} passHref legacyBehavior>
                  <MuiLink variant="caption" sx={{ cursor: "pointer" }}>
                    <Icon icon="mdi:eye" style={{ marginRight: 2, verticalAlign: "middle" }} />
                    {t("YearlyStats.view_game")}
                  </MuiLink>
                </Link>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t("YearlyStats.no_defeat")}
              </Typography>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
