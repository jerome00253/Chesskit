import {
  Card,
  CardContent,
  Typography,
  useTheme,
  Grid2 as Grid,
} from "@mui/material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { useTranslations } from "next-intl";
import { Game } from "@/types/game";
import { useMemo } from "react";
import { format, eachMonthOfInterval, subMonths } from "date-fns";
import { fr, enUS, es, de, it, nl, pt, type Locale } from "date-fns/locale";
import { useRouter } from "next/router";
import { MoveClassification } from "@/types/enums";
import { motion } from "framer-motion";

interface EvolutionChartsProps {
  games: Game[];
  userName: string | null | undefined;
}

const localeMap: Record<string, Locale> = {
  fr,
  en: enUS,
  es,
  de,
  it,
  nl,
  pt,
};

export const EvolutionCharts = ({ games, userName }: EvolutionChartsProps) => {
  const t = useTranslations("Dashboard.evolution");
  const theme = useTheme();
  const router = useRouter();
  const locale = (router.query.locale as string) || "en";

  // 1. Elo History
  const eloHistoryData = useMemo(() => {
    if (!userName || games.length === 0) return [];

    // Filter games where user played
    const userGames = games
      .filter(
        (g) =>
          (g.white.name === userName ||
            g.black.name === userName ||
            g.userColor === "white" ||
            g.userColor === "black") &&
          g.date
      )
      .sort((a, b) => {
        const dateA = a.date
          ? a.date.includes(".")
            ? new Date(a.date.replace(/\./g, "-"))
            : new Date(a.date)
          : new Date(0);
        const dateB = b.date
          ? b.date.includes(".")
            ? new Date(b.date.replace(/\./g, "-"))
            : new Date(b.date)
          : new Date(0);
        return dateA.getTime() - dateB.getTime(); // Oldest first
      });

    return userGames
      .map((game) => {
        const userIsWhite =
          game.userColor === "white" || (game.white.name && game.white.name === userName);
        const rating = userIsWhite ? game.white.rating : game.black.rating;

        if (!rating) return null;

        // Parse date
        let dateObj: Date;
        if (typeof game.date === "string") {
            const isYYYYMMDD = /^\d{4}\.\d{2}\.\d{2}/.test(game.date);
            const dateStr = isYYYYMMDD ? game.date.replace(/\./g, "-") : game.date;
            dateObj = new Date(dateStr);
        } else if (typeof game.date === "object" && game.date instanceof Date) {
            dateObj = game.date;
        } else {
            return null;
        }

        if (isNaN(dateObj.getTime())) return null;

        // Determine source
        const origin = (game.importOrigin || "").toLowerCase();
        const site = (game.site || "").toLowerCase();
        const url = (game.gameUrl || "").toLowerCase();

        let source = "other";
        if (origin === "chesscom" || site.includes("chess.com") || url.includes("chess.com")) {
            source = "chesscom";
        } else if (origin === "lichess" || site.includes("lichess") || url.includes("lichess")) {
            source = "lichess";
        }

        return {
          timestamp: dateObj.getTime(),
          dateLabel: format(dateObj, "dd/MM/yy", { locale: localeMap[locale] || enUS }),
          chesscom: source === "chesscom" ? rating : null,
          lichess: source === "lichess" ? rating : null,
          other: source === "other" ? rating : null,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, [games, userName, locale]);

  // 2. Activity Evolution (Last 12 months)
  const activityData = useMemo(() => {
    if (!games.length) return [];
    const end = new Date();
    const start = subMonths(end, 11); // Last 12 months

    const months = eachMonthOfInterval({ start, end });

    const data = months.map((month) => {
      const monthStr = format(month, "yyyy-MM");
      const monthLabel = format(month, "MMM yyyy", { locale: localeMap[locale] || enUS });

      let count = 0;
      games.forEach((game) => {
        if (!game.date) return;
        let dateStr: string = "";
        if (typeof game.date === "string") {
            dateStr = game.date.includes(".") ? game.date.replace(/\./g, "-") : game.date;
        } else if ((game.date as any) instanceof Date) {
            dateStr = (game.date as any).toISOString();
        }
        
        if (dateStr.startsWith(monthStr)) count++;
      });

      return {
        month: monthLabel,
        games: count,
      };
    });
    return data;
  }, [games, locale]);

  // 3. Quality Trends (All analyzed games with adaptive grouping)
  const qualityData = useMemo(() => {
    if (!userName) return [];
    
    // Get all analyzed games sorted chronologically
    const analyzedGames = games
      .filter((g) => g.analyzed && g.eval?.positions && g.date)
      .sort((a, b) => {
        const dateA = a.date
          ? typeof a.date === 'string' && a.date.includes(".")
            ? new Date(a.date.replace(/\./g, "-"))
            : new Date(a.date!)
          : new Date(0);
        const dateB = b.date
          ? typeof b.date === 'string' && b.date.includes(".")
            ? new Date(b.date.replace(/\./g, "-"))
            : new Date(b.date!)
          : new Date(0);
        return dateA.getTime() - dateB.getTime();
      });

    if (analyzedGames.length === 0) return [];

    // Calculate user stats for each game
    const gamesWithStats = analyzedGames
      .map((game) => {
        const userIsWhite =
          game.userColor === "white" || (game.white.name && game.white.name === userName);
        const userIsBlack =
          game.userColor === "black" || (game.black.name && game.black.name === userName);
        
        if (!userIsWhite && !userIsBlack) return null;

        let brilliant = userIsWhite ? game.whiteBrilliant : game.blackBrilliant;
        let blunder = userIsWhite ? game.whiteBlunders : game.blackBlunders;

        if (brilliant === undefined || blunder === undefined) {
          brilliant = 0;
          blunder = 0;
          game.eval?.positions?.forEach((pos, i) => {
            const isWhiteMove = i % 2 === 0;
            if ((userIsWhite && isWhiteMove) || (userIsBlack && !isWhiteMove)) {
              if (pos.moveClassification === MoveClassification.Splendid)
                brilliant!++;
              if (pos.moveClassification === MoveClassification.Blunder)
                blunder!++;
            }
          });
        }

        // Parse date properly - handle both string formats and Date objects
        let dateObj: Date;
        if (typeof game.date === "string") {
          // Only replace dots if it's the YYYY.MM.DD format, not ISO format with .000Z
          const isYYYYMMDD = /^\d{4}\.\d{2}\.\d{2}/.test(game.date);
          const dateStr = isYYYYMMDD
            ? game.date.replace(/\./g, "-")
            : game.date;
          dateObj = new Date(dateStr);
        } else if ((game.date as any) instanceof Date) {
          dateObj = game.date as any;
        } else {
          return null; // Skip if date is neither string nor Date
        }

        // Validate the date
        if (isNaN(dateObj.getTime())) {
          return null; // Skip invalid dates
        }

        return {
          date: dateObj,
          brilliant: brilliant || 0,
          blunder: blunder || 0,
        };
      })
      .filter((item): item is { date: Date; brilliant: number; blunder: number } => item !== null);

    if (gamesWithStats.length === 0) return [];

    // Determine grouping level to have ~30 points max
    const totalGames = gamesWithStats.length;
    let groupBy: "game" | "day" | "week" | "month";
    
    if (totalGames <= 30) {
      groupBy = "game";
    } else if (totalGames <= 210) { // ~30 days * 7 games/day
      groupBy = "day";
    } else if (totalGames <= 840) { // ~30 weeks * 28 games/week
      groupBy = "week";
    } else {
      groupBy = "month";
    }

    // Group data
    const grouped = new Map<string, { brilliant: number[]; blunder: number[]; timestamp: number }>();
    
    gamesWithStats.forEach((game) => {
      // Skip invalid dates
      if (!game.date || isNaN(game.date.getTime())) return;
      
      let key: string;
      try {
        if (groupBy === "game") {
          // Remove time for individual games, just show date
          key = format(game.date, "dd/MM/yy", { locale: localeMap[locale] || enUS });
        } else if (groupBy === "day") {
          key = format(game.date, "dd/MM/yy", { locale: localeMap[locale] || enUS });
        } else if (groupBy === "week") {
          const weekStart = new Date(game.date);
          weekStart.setDate(game.date.getDate() - game.date.getDay());
          key = format(weekStart, "dd/MM/yy", { locale: localeMap[locale] || enUS });
        } else {
          key = format(game.date, "MMM yyyy", { locale: localeMap[locale] || enUS });
        }
      } catch {
        return; // Skip if formatting fails
      }

      if (!grouped.has(key)) {
        grouped.set(key, { brilliant: [], blunder: [], timestamp: game.date.getTime() });
      }
      grouped.get(key)!.brilliant.push(game.brilliant);
      grouped.get(key)!.blunder.push(game.blunder);
    });

    // Calculate averages and sort chronologically (oldest first)
    const result = Array.from(grouped.entries())
      .map(([date, stats]) => ({
        date,
        brilliant: stats.brilliant.reduce((a, b) => a + b, 0) / stats.brilliant.length,
        blunder: stats.blunder.reduce((a, b) => a + b, 0) / stats.blunder.length,
        timestamp: stats.timestamp,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return result;
  }, [games, userName, locale]);

  // ... (rest of code) ...

  return (
    <Grid container spacing={3}>
      {/* Elo History */}
      <Grid size={{ xs: 12, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            elevation={0}
            sx={{
              height: 350,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t("elo_history")}
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={eloHistoryData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={theme.palette.divider}
                  />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => {
                      try {
                        return format(new Date(val), "dd/MM/yy", { locale: localeMap[locale] || enUS });
                      } catch {
                        return "";
                      }
                    }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={40}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    labelFormatter={(val) => {
                         try {
                            return format(new Date(val), "dd MMM yyyy", { locale: localeMap[locale] || enUS });
                         } catch { return val; }
                    }}
                    contentStyle={{
                      borderRadius: 8,
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <Legend />
                  <Line
                    connectNulls
                    type="monotone"
                    dataKey="chesscom"
                    name="Chess.com"
                    stroke="#81b64c" // Chess.com green
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    connectNulls
                    type="monotone"
                    dataKey="lichess"
                    name="Lichess"
                    stroke={theme.palette.mode === 'dark' ? '#fff' : '#000'} // Lichess theme
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    connectNulls
                    type="monotone"
                    dataKey="other"
                    name={t("games_played")} // generic fallback
                    stroke="#ff9800"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Activity Evolution */}
      <Grid size={{ xs: 12, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card
            elevation={0}
            sx={{
              height: 350,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t("activity")}
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={activityData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={theme.palette.divider}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="games"
                    stroke="#4caf50"
                    fill="#4caf50"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Quality Trends */}
      <Grid size={12}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            elevation={0}
            sx={{
              height: 350,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t("quality")}
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={qualityData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={theme.palette.divider}
                  />
                  <XAxis
                    dataKey="date"
                    label={{
                      value: t("recent_games"),
                      position: "insideBottom",
                      offset: -5,
                    }}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Line
                    type="monotone"
                    dataKey="brilliant"
                    stroke="#9c27b0"
                    name={t("brilliant")}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="blunder"
                    stroke="#f44336"
                    name={t("blunder")}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  );
};
