import { Card, CardContent, Typography, Box, useTheme } from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useTranslations } from "next-intl";
import { Game } from "@/types/game";
import { useMemo } from "react";

interface HourlyPerformanceChartProps {
  games: Game[];
  userName: string | null | undefined;
}

export const HourlyPerformanceChart = ({
  games,
  userName,
}: HourlyPerformanceChartProps) => {
  const t = useTranslations("Dashboard.hourly");
  const theme = useTheme();

  const data = useMemo(() => {
    if (!userName) return [];

    // Initialize hours 0-23
    const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      wins: 0,
      total: 0,
    }));

    games.forEach((game) => {
      // We need a full timestamp to get the hour.
      // Many PGNs only have YYYY.MM.DD.
      // If the game object has an accurate 'createdAt' or 'startTime' or Time from PGN, we use it.
      // The `game.date` is often just date.
      // However, `game.pgn` might contain [Time "HH:MM:SS"] or [StartTime "HH:MM:SS"].
      // Let's try to parse time from PGN if date object doesn't have it.

      let hour = -1;

      // S'appuyer sur game.date si c'est un datetime (Prisma DateTime)
      // Mais prisma `date` field is often from PGN [Date]
      // Check if we have a proper timestamp elsewhere?
      // The schema has createdAt, but that's when it was imported. relying on Time tag in PGN is better.

      const timeMatch = game.pgn.match(/\[Time "(\d{2}):(\d{2}):(\d{2})"\]/);
      if (timeMatch) {
        hour = parseInt(timeMatch[1]);
      } else if (game.date && game.date.includes("T")) {
        // ISO String
        const dateObj = new Date(game.date);
        hour = dateObj.getHours();
      }

      if (hour === -1) return;

      const userIsWhite =
        game.userColor === "white" || game.white.name === userName;
      const userIsBlack =
        game.userColor === "black" || game.black.name === userName;

      if (!userIsWhite && !userIsBlack) return;

      hourlyStats[hour].total++;

      const won =
        (userIsWhite && game.result === "1-0") ||
        (userIsBlack && game.result === "0-1");
      if (won) hourlyStats[hour].wins++;
    });

    return hourlyStats
      .map((stat) => ({
        hour: `${stat.hour}:00`,
        winRate:
          stat.total > 0 ? Math.round((stat.wins / stat.total) * 100) : 0,
        games: stat.total,
      }))
      .filter((d) => d.games > 0); // Only show hours with games? Or show all? showing all 24 might be wide.
    // Let's filter to where we have content or at least show relevant range.
    // Show all 0-23 is safer for "Clock" context.
  }, [games, userName]);

  return (
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
          {t("title")}
        </Typography>

        <Box sx={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={theme.palette.divider}
              />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                unit="%"
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: theme.palette.action.hover }}
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                }}
              />
              <Bar dataKey="winRate" name="Win Rate" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.winRate > 50 ? "#4caf50" : "#ff9800"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};
