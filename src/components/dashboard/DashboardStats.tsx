import {
  Card,
  CardContent,
  Typography,
  Grid2 as Grid,
  Box,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
  <Card elevation={2} sx={{ height: "100%" }}>
    <CardContent>
      <Grid container spacing={2} alignItems="center">
        <Grid>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: "50%",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon icon={icon} width={32} height={32} color={color} />
          </Box>
        </Grid>
        <Grid size="grow">
          <Typography color="textSecondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

interface DashboardStatsProps {
  totalGames: number;
  winRate: number;
  drawRate: number;
  lossRate: number;
  accuracy: number;
  bestStreak: number;
}

export default function DashboardStats({
  totalGames,
  winRate,
  accuracy,
  bestStreak,
}: DashboardStatsProps) {
  const t = useTranslations("Dashboard.stats");

  return (
    <Grid container spacing={3} width="100%">
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title={t("total_games")}
          value={totalGames}
          icon="mdi:chess-pawn"
          color="#3f51b5"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title={t("win_rate")}
          value={`${winRate}%`}
          icon="mdi:trophy"
          color="#4caf50"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title={t("avg_accuracy")}
          value={accuracy > 0 ? `${accuracy}%` : "-"}
          icon="mdi:target"
          color="#ff9800"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title={t("best_streak")}
          value={bestStreak}
          icon="mdi:fire"
          color="#f44336"
        />
      </Grid>
    </Grid>
  );
}
