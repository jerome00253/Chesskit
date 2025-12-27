import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid2 as Grid,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { PageTitle } from "@/components/pageTitle";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { MoveClassification } from "@/types/enums";
import { motion } from "framer-motion";

// Import new stats helpers and components
import {
  findBestVictory,
  findWorstDefeat,
  findMostFrequentOpponent,
  estimateGameDuration,
  parseTermination,
  filterGamesByPeriod,
  filterGamesBySource,
  TimePeriod,
  GameSource,
  getGameTypeLabel,
  classifyGameType,
  getMoveCount,
} from "@/lib/statsHelpers";
import { BestWorstGamesCard } from "@/components/dashboard/BestWorstGamesCard";
import { PlayTimeCard } from "@/components/dashboard/PlayTimeCard";
import { ColorPerformanceChart } from "@/components/dashboard/ColorPerformanceChart";
import { OpponentStatsCard } from "@/components/dashboard/OpponentStatsCard";
import { VictoryBreakdownChart } from "@/components/dashboard/VictoryBreakdownChart";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { EvolutionCharts } from "@/components/dashboard/EvolutionCharts";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";

export { getStaticPaths, getStaticProps };

export default function Dashboard() {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const { data: session } = useSession();
  const { games } = useGameDatabase(true);

  const [period, setPeriod] = useState<TimePeriod>("all");
  const [source, setSource] = useState<GameSource>("all");

  // Filter games based on selection
  const filteredGames = useMemo(() => {
    if (!games) return [];
    let result = filterGamesByPeriod(games, period);
    result = filterGamesBySource(result, source);
    return result;
  }, [games, period, source]);
  /* 
   * Statistics calculation
   * Memoized to avoid recalculations on every render
   */
  const stats = useMemo(() => {
    if (!filteredGames.length || !session?.user?.name) {
      return {
        totalGames: 0,
        winRate: 0,
        drawRate: 0,
        lossRate: 0,
        accuracy: 0,
        bestStreak: 0,
        avgMovesPerGame: 0,
        avgBrilliant: 0,
        avgExcellent: 0,
        avgBlunders: 0,
        avgMistakes: 0,
        avgInaccuracies: 0,
        analysisRate: 0,
      };
    }

    const userName = session.user.name;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let totalAccuracy = 0;
    let gamesWithAccuracy = 0;
    let totalMoves = 0;
    let gamesWithMoves = 0;
    let currentStreak = 0;
    let bestStreak = 0;

    // Quality stats totals
    let totalBrilliant = 0;
    let totalExcellent = 0;
    let totalBlunders = 0;
    let totalMistakes = 0;
    let totalInaccuracies = 0;
    let gamesWithEval = 0;

    filteredGames.forEach((game) => {
      // Determine if user played White or Black
      const userIsWhite =
        game.white.name.toLowerCase() === userName.toLowerCase() ||
        game.userColor === "white";
      const userIsBlack =
        game.black.name.toLowerCase() === userName.toLowerCase() ||
        game.userColor === "black";

      if (!userIsWhite && !userIsBlack) return;

      const result = game.result;
      if (result === "1-0") {
        if (userIsWhite) {
          wins++;
          currentStreak++;
          if (currentStreak > bestStreak) bestStreak = currentStreak;
        } else {
          losses++;
          currentStreak = 0;
        }
      } else if (result === "0-1") {
        if (userIsBlack) {
          wins++;
          currentStreak++;
          if (currentStreak > bestStreak) bestStreak = currentStreak;
        } else {
          losses++;
          currentStreak = 0;
        }
      } else {
        draws++;
        currentStreak = 0;
      }

      const userAccuracy = userIsWhite ? game.whiteAccuracy : game.blackAccuracy;
      if (userAccuracy) {
        totalAccuracy += userAccuracy;
        gamesWithAccuracy++;
      } else if (game.eval?.accuracy) {
        const evalAccuracy = userIsWhite
          ? game.eval.accuracy.white
          : game.eval.accuracy.black;
        if (evalAccuracy) {
          totalAccuracy += evalAccuracy;
          gamesWithAccuracy++;
        }
      }

      // Calculations based on DB fields first (faster)
      if (userIsWhite) {
        if (game.whiteBrilliant !== undefined)
          totalBrilliant += game.whiteBrilliant;
        if (game.whiteSplendid !== undefined)
          totalBrilliant += game.whiteSplendid; // Count splendid as brilliant for stats
        if (game.whiteExcellent !== undefined || game.whiteBest !== undefined)
          totalExcellent += (game.whiteExcellent || 0) + (game.whiteBest || 0);
        if (game.whiteBlunders !== undefined)
          totalBlunders += game.whiteBlunders;
        if (game.whiteMistakes !== undefined)
          totalMistakes += game.whiteMistakes;
        if (game.whiteInaccuracy !== undefined)
          totalInaccuracies += game.whiteInaccuracy;
      } else {
        if (game.blackBrilliant !== undefined)
          totalBrilliant += game.blackBrilliant;
        if (game.blackSplendid !== undefined)
          totalBrilliant += game.blackSplendid;
        if (game.blackExcellent !== undefined || game.blackBest !== undefined)
          totalExcellent += (game.blackExcellent || 0) + (game.blackBest || 0);
        if (game.blackBlunders !== undefined)
          totalBlunders += game.blackBlunders;
        if (game.blackMistakes !== undefined)
          totalMistakes += game.blackMistakes;
        if (game.blackInaccuracy !== undefined)
          totalInaccuracies += game.blackInaccuracy;
      }

      // Count analyzed games properly (only if eval.positions exists)
      if (game.eval?.positions && game.eval.positions.length > 0) {
        gamesWithEval++;
      }

      // Count moves once per game using the same function as database
      if (game.pgn) {
        const movesCount = getMoveCount(game.pgn);
        totalMoves += movesCount;
        gamesWithMoves++;
      }
    });

    const totalGames = wins + draws + losses;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const drawRate =
      totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0;
    const lossRate =
      totalGames > 0 ? Math.round((losses / totalGames) * 100) : 0;
    const accuracy =
      gamesWithAccuracy > 0 ? Math.round(totalAccuracy / gamesWithAccuracy) : 0;
    const avgMovesPerGame =
      gamesWithMoves > 0 ? Math.round(totalMoves / gamesWithMoves) : 0;
    const avgBrilliant =
      gamesWithEval > 0 ? (totalBrilliant / gamesWithEval).toFixed(1) : 0;
    const avgExcellent =
      gamesWithEval > 0 ? (totalExcellent / gamesWithEval).toFixed(1) : 0;
    const avgBlunders =
      gamesWithEval > 0 ? (totalBlunders / gamesWithEval).toFixed(1) : 0;
    const avgMistakes =
      gamesWithEval > 0 ? (totalMistakes / gamesWithEval).toFixed(1) : 0;
    const avgInaccuracies =
      gamesWithEval > 0 ? (totalInaccuracies / gamesWithEval).toFixed(1) : 0;

    const analysisRate = totalGames > 0 ? Math.round((gamesWithEval / totalGames) * 100) : 0;

    console.log("📊 DEBUG Stats:", {
      totalGames,
      gamesWithEval,
      analysisRate,
      gamesWithMoves,
      totalMoves,
      avgMovesPerGame,
    });

    return {
      totalGames,
      winRate,
      drawRate,
      lossRate,
      accuracy,
      bestStreak,
      avgMovesPerGame,
      avgBrilliant: Number(avgBrilliant),
      avgExcellent: Number(avgExcellent),
      avgBlunders: Number(avgBlunders),
      avgMistakes: Number(avgMistakes),
      avgInaccuracies: Number(avgInaccuracies),
      analysisRate,
    };
  }, [filteredGames, session]);

  // Charts Data
  const chartsData = useMemo(() => {
    if (!filteredGames || filteredGames.length === 0 || !session?.user?.name) {
      return {
        resultsData: [],
        openingsData: [],
        gameTypeData: [],
      };
    }
    const userName = session.user.name;

    // Results
    let wins = 0,
      draws = 0,
      losses = 0;
    filteredGames.forEach((game) => {
      const userIsWhite =
        game.userColor === "white" || 
        (game.white.name && userName && game.white.name.toLowerCase() === userName.toLowerCase());
      const userIsBlack =
        game.userColor === "black" || 
        (game.black.name && userName && game.black.name.toLowerCase() === userName.toLowerCase());
      if (!userIsWhite && !userIsBlack) return;
      if (game.result === "1-0") userIsWhite ? wins++ : losses++;
      else if (game.result === "0-1") userIsBlack ? wins++ : losses++;
      else if (game.result === "1/2-1/2") draws++;
    });
    const resultsData = [
      { name: t("charts.wins"), value: wins, color: "#4caf50" },
      { name: t("charts.draws"), value: draws, color: "#ff9800" },
      { name: t("charts.losses"), value: losses, color: "#f44336" },
    ];

    // Openings (Win/Draw/Loss)
    const openingsMap = new Map<
      string,
      { wins: number; draws: number; losses: number; games: number }
    >();
    filteredGames.forEach((game) => {
      if (!game.openingName) return;
      const opening = game.openingName.split(":")[0]; // Group by simple name
      const current = openingsMap.get(opening) || {
        wins: 0,
        draws: 0,
        losses: 0,
        games: 0,
      };
      current.games++;

      const userIsWhite =
        game.userColor === "white" || 
        (game.white.name && userName && game.white.name.toLowerCase() === userName.toLowerCase());
      const userIsBlack =
        game.userColor === "black" || 
        (game.black.name && userName && game.black.name.toLowerCase() === userName.toLowerCase());

      if (game.result === "1/2-1/2") current.draws++;
      else if (
        (userIsWhite && game.result === "1-0") ||
        (userIsBlack && game.result === "0-1")
      )
        current.wins++;
      else current.losses++;

      openingsMap.set(opening, current);
    });

    const openingsData = Array.from(openingsMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 8); // Top 8

    // Game Types (Aggregated)
    const gameTypeMap = new Map<string, number>();
    filteredGames.forEach((game) => {
      let type = game.gameType?.toLowerCase();
      
      // If gameType is not set, derive it from timeControl
      if (!type && game.timeControl) {
        type = classifyGameType(game.timeControl);
      }
      
      const gameType = type || "unknown";
      gameTypeMap.set(gameType, (gameTypeMap.get(gameType) || 0) + 1);
    });

    const gameTypeData = Array.from(gameTypeMap.entries()).map(
      ([name, value]) => ({
        name: getGameTypeLabel(name),
        value,
        color:
          name === "bullet"
            ? "#f44336"
            : name === "blitz"
              ? "#ff9800"
              : name === "rapid"
                ? "#2196f3"
                : "#4caf50",
      })
    );

    return { resultsData, openingsData, gameTypeData };
  }, [filteredGames, session, t]);

  // Yearly Stats helpers (using filteredGames for consistency or keep separate?
  // User requested filters for "Dashboard", implying everything.
  // But "Statistics 2025" implies current year.
  // If user selects "Last Month", seeing "Statistics 2025" is weird.
  // I should probably rename "YearlyStats" to "Detailed Stats" and use filteredGames.
  // BUT checking existing YearlyStats implementation...

  // The implementation plan implies existing yearly stats are kept but maybe updated.
  // Let's use filteredGames for everything.

  const bestVictory = useMemo(
    () =>
      session?.user?.name
        ? findBestVictory(filteredGames, session.user.name)
        : null,
    [filteredGames, session]
  );
  const worstDefeat = useMemo(
    () =>
      session?.user?.name
        ? findWorstDefeat(filteredGames, session.user.name)
        : null,
    [filteredGames, session]
  );
  const totalPlayTimeHours = useMemo(
    () =>
      filteredGames.reduce((acc, game) => acc + estimateGameDuration(game), 0) /
      3600,
    [filteredGames]
  );

  const colorPerformance = useMemo(() => {
    if (!session?.user?.name) return { whiteWinRate: 0, blackWinRate: 0 };
    const userName = session.user.name;
    let whiteGames = 0,
      whiteWins = 0,
      blackGames = 0,
      blackWins = 0;
    filteredGames.forEach((game) => {
      const userIsWhite =
        game.userColor === "white" || 
        (game.white.name && userName && game.white.name.toLowerCase() === userName.toLowerCase());
      if (userIsWhite) {
        whiteGames++;
        if (game.result === "1-0") whiteWins++;
      } else {
        blackGames++;
        if (game.result === "0-1") blackWins++;
      }
    });
    return {
      whiteWinRate:
        whiteGames > 0 ? Math.round((whiteWins / whiteGames) * 100) : 0,
      blackWinRate:
        blackGames > 0 ? Math.round((blackWins / blackGames) * 100) : 0,
    };
  }, [filteredGames, session]);

  const frequentOpponent = useMemo(
    () =>
      session?.user?.name
        ? findMostFrequentOpponent(filteredGames, session.user.name)
        : null,
    [filteredGames, session]
  );
  const victoryBreakdown = useMemo(() => {
    if (!session?.user?.name)
      return { checkmate: 0, resignation: 0, timeout: 0 };
    let checkmate = 0,
      resignation = 0,
      timeout = 0;
    const userName = session.user.name;
    filteredGames.forEach((game) => {
      const userIsWhite =
        game.userColor === "white" || 
        (game.white.name && userName && game.white.name.toLowerCase() === userName.toLowerCase());
      const userWon =
        (userIsWhite && game.result === "1-0") ||
        (!userIsWhite && game.result === "0-1");
      if (!userWon) return;
      const term = parseTermination(game.pgn);
      if (term === "checkmate") checkmate++;
      else if (term === "resignation") resignation++;
      else if (term === "timeout") timeout++;
    });
    return { checkmate, resignation, timeout };
  }, [filteredGames, session]);

  if (!games || games.length === 0) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <PageTitle title={t("title")} />
        <Card
          elevation={0}
          sx={{ mt: 4, border: "1px solid", borderColor: "divider" }}
        >
          <CardContent sx={{ textAlign: "center", py: 8 }}>
            <Icon
              icon="mdi:chart-box-outline"
              width={80}
              height={80}
              color="#ccc"
            />
            <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
              {t("no_games_yet")}
            </Typography>
            <Button
              variant="contained"
              onClick={() =>
                router.push(`/${router.query.locale || "en"}/play`)
              }
            >
              {t("play_now")}
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: "auto" }}>
      <PageTitle title={t("title")} />

      {/* Filters */}
      <DashboardFilters
        period={period}
        setPeriod={setPeriod}
        source={source}
        setSource={setSource}
      />

      {/* Main Stats (Badges style) */}
      <Box sx={{ mt: 2, mb: 4 }}>
        <DashboardStats
          totalGames={stats.totalGames}
          winRate={stats.winRate}
          drawRate={stats.drawRate}
          lossRate={stats.lossRate}
          accuracy={stats.accuracy}
          bestStreak={stats.bestStreak}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Average Stats Cards - Moved to top */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                {t("stats.avg_brilliant")}
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="#9c27b0">
                {stats.avgBrilliant}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                {t("stats.avg_blunders")}
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="#f44336">
                {stats.avgBlunders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                {t("stats.analysis_rate")}
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="secondary">
                {stats.analysisRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                {t("stats.avg_moves")}
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.avgMovesPerGame}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Performance Cards */}
        <Grid size={12}>
          <BestWorstGamesCard
            bestVictory={bestVictory}
            worstDefeat={worstDefeat}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <PlayTimeCard totalHours={totalPlayTimeHours} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ColorPerformanceChart
            whiteWinRate={colorPerformance.whiteWinRate}
            blackWinRate={colorPerformance.blackWinRate}
          />
        </Grid>

        {frequentOpponent && (
          <Grid size={{ xs: 12, md: 6 }}>
            <OpponentStatsCard
              opponent={frequentOpponent.opponent}
              totalGames={frequentOpponent.totalGames}
              wins={frequentOpponent.wins}
              draws={frequentOpponent.draws}
              losses={frequentOpponent.losses}
            />
          </Grid>
        )}

        <Grid size={{ xs: 12, md: frequentOpponent ? 6 : 12 }}>
          <VictoryBreakdownChart
            checkmate={victoryBreakdown.checkmate}
            resignation={victoryBreakdown.resignation}
            timeout={victoryBreakdown.timeout}
          />
        </Grid>

        {/* Evolution Charts */}
        <Grid size={12}>
          <EvolutionCharts
            games={filteredGames}
            userName={session?.user?.name}
          />
        </Grid>

        {/* Left Column: Heatmap & Hourly */}
        <Grid size={{ xs: 12, lg: 4 }} container spacing={3} direction="column">
          <Grid>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ActivityHeatmap games={games} />
            </motion.div>
          </Grid>
        </Grid>

        {/* Middle/Right: Charts & Distributions */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <DashboardCharts
              resultsData={chartsData.resultsData}
              openingsData={chartsData.openingsData}
              gameTypeData={chartsData.gameTypeData}
              bestStreak={stats.bestStreak}
            />
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
