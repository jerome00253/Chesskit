import {
  Card,
  CardContent,
  Typography,
  Grid2 as Grid,
  Chip,
  Box,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface OpponentStatsCardProps {
  opponent: string;
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
}

export function OpponentStatsCard({
  opponent,
  totalGames,
  wins,
  draws,
  losses,
}: OpponentStatsCardProps) {
  const t = useTranslations("Dashboard");
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h6" gutterBottom>
            <Icon
              icon="mdi:account-multiple"
              style={{ marginRight: 8, verticalAlign: "middle" }}
            />
            {t("YearlyStats.main_opponent_title")}
          </Typography>
          <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
            {opponent}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            gutterBottom
          >
            {t("YearlyStats.games_played", { count: totalGames })}
          </Typography>
        </Box>
        <Box sx={{ my: 2 }}>
          <Grid container spacing={1}>
            <Grid>
              <Chip
                icon={<Icon icon="mdi:trophy" />}
                label={t("YearlyStats.wins", { count: wins })}
                color="success"
                size="small"
              />
            </Grid>
            <Grid>
              <Chip
                icon={<Icon icon="mdi:handshake" />}
                label={t("YearlyStats.draws", { count: draws })}
                color="warning"
                size="small"
              />
            </Grid>
            <Grid>
              <Chip
                icon={<Icon icon="mdi:close-circle" />}
                label={t("YearlyStats.losses", { count: losses })}
                color="error"
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
        <Typography variant="h6" color="primary" sx={{ mt: "auto" }}>
          {t("YearlyStats.win_rate", { rate: winRate })}
        </Typography>
      </CardContent>
    </Card>
  );
}
