import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  Typography,
  Grid2 as Grid,
  Box,
  useTheme,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

interface DashboardChartsProps {
  resultsData: { name: string; value: number; color: string }[];
  openingsData: {
    name: string;
    wins: number;
    draws: number;
    losses: number;
    games: number;
  }[];
  gameTypeData: { name: string; value: number; color: string }[];
  bestStreak: number;
}

export default function DashboardCharts({
  resultsData,
  openingsData,
  gameTypeData,
  bestStreak,
}: DashboardChartsProps) {
  const theme = useTheme();
  const t = useTranslations("Dashboard.charts");

  return (
    <Grid container spacing={3} width="100%">
      {/* Results Distribution */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card
          elevation={0}
          sx={{
            height: "100%",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t("results")}
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {resultsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Openings (Stacked Bar) */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card
          elevation={0}
          sx={{
            height: "100%",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t("top_openings")}
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={openingsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={180}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 8,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="wins"
                    name={t("wins")}
                    stackId="a"
                    fill="#4caf50"
                  />
                  <Bar
                    dataKey="draws"
                    name={t("draws")}
                    stackId="a"
                    fill="#ff9800"
                  />
                  <Bar
                    dataKey="losses"
                    name={t("losses")}
                    stackId="a"
                    fill="#f44336"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Game Type Distribution & Best Streak */}
      <Grid container size={12} spacing={3}>
        {gameTypeData && gameTypeData.length > 0 && (
          <Grid size={{ xs: 12, md: 8 }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t("game_type_distribution")}
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gameTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {gameTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Best Streak Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  display: "inline-flex",
                  p: 2,
                  borderRadius: "50%",
                  bgcolor: "rgba(255, 152, 0, 0.1)",
                  mb: 2,
                }}
              >
                <Icon
                  icon="mdi:fire"
                  width={48}
                  height={48}
                  color="#ff9800"
                />
              </Box>
              <Typography variant="h3" color="text.primary" fontWeight="bold">
                {bestStreak}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {t("best_streak")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );
}
