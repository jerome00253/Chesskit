import {
  Box,
  Card,
  CardContent,
  Typography,
  Tooltip,
  useTheme,
} from "@mui/material";
import { ActivityCalendar, ThemeInput } from "react-activity-calendar";
import { useTranslations } from "next-intl";
import { Game } from "@/types/game";
import { useMemo } from "react";

interface ActivityHeatmapProps {
  games: Game[];
}

export const ActivityHeatmap = ({ games }: ActivityHeatmapProps) => {
  const t = useTranslations("Dashboard.heatmap");
  const theme = useTheme();

  const data = useMemo(() => {
    // Map dates to counts
    const counts: Record<string, number> = {};

    games.forEach((game) => {
      if (!game.date) return;

      // Parse date - handle both ISO and YYYY.MM.DD formats
      let dateStr = game.date;

      // Only convert YYYY.MM.DD format (not ISO dates with dots in time)
      if (/^\d{4}\.\d{2}\.\d{2}/.test(dateStr)) {
        dateStr = dateStr.replace(/\./g, "-");
      }

      // Extract just the date part (YYYY-MM-DD) from ISO strings
      if (dateStr.includes("T")) {
        dateStr = dateStr.split("T")[0];
      }

      if (!counts[dateStr]) counts[dateStr] = 0;
      counts[dateStr]++;
    });

    // Convert to array
    const activityData = Object.entries(counts).map(([date, count]) => {
      // Calculate level 0-4
      let level = 0;
      if (count >= 1) level = 1;
      if (count >= 3) level = 2;
      if (count >= 6) level = 3;
      if (count >= 10) level = 4;

      return {
        date,
        count,
        level,
      };
    });

    return activityData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [games]);

  // Generate theme colors
  const calendarTheme: ThemeInput = {
    light: ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"],
    dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: 350,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <CardContent
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Typography variant="h6" gutterBottom>
          {t("title")}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            overflowX: "auto",
          }}
        >
          {data.length > 0 ? (
            <ActivityCalendar
              data={data}
              theme={calendarTheme}
              colorScheme={theme.palette.mode === "dark" ? "dark" : "light"}
              renderBlock={(block, activity) => (
                <Tooltip title={`${activity.count} games on ${activity.date}`}>
                  {block}
                </Tooltip>
              )}
              blockSize={12}
              blockMargin={4}
            />
          ) : (
            <Typography color="text.secondary">
              No activity data to display
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
