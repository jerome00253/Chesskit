import { Box, Button, Card, CardContent, Typography, Grid2 as Grid } from "@mui/material";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { PageTitle } from "@/components/pageTitle";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { useMemo } from "react";
import { Icon } from "@iconify/react";
import { MoveClassification } from "@/types/enums";

// Import new stats helpers and components
import { 
  filterCurrentYear, 
  findBestVictory, 
  findWorstDefeat, 
  findMostFrequentOpponent,
  estimateGameDuration,
  parseTermination 
} from "@/lib/statsHelpers";
import { BestWorstGamesCard } from "@/components/dashboard/BestWorstGamesCard";
import { PlayTimeCard } from "@/components/dashboard/PlayTimeCard";
import { ColorPerformanceChart } from "@/components/dashboard/ColorPerformanceChart";
import { OpponentStatsCard } from "@/components/dashboard/OpponentStatsCard";
import { VictoryBreakdownChart } from "@/components/dashboard/VictoryBreakdownChart";

export { getStaticPaths, getStaticProps };

export default function Dashboard() {
    const t = useTranslations("Dashboard");
    const router = useRouter();
    const { data: session } = useSession();
    const { games } = useGameDatabase(true);

    // Calculate statistics from games
    const stats = useMemo(() => {
        if (!games || games.length === 0 || !session?.user?.name) {
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
            };
        }

        const userName = session.user.name;
        let wins = 0;
        let draws = 0;
        let losses = 0;
        let totalAccuracy = 0;
        let gamesWithAccuracy = 0;
        let currentStreak = 0;
        let bestStreak = 0;
        let totalMoves = 0;
        let gamesWithMoves = 0;

        // Move classification counters
        let totalBrilliant = 0;
        let totalExcellent = 0;
        let totalBlunders = 0;
        let totalMistakes = 0;
        let totalInaccuracies = 0;
        let gamesWithEval = 0;

        games.forEach((game) => {
            // Determine if user is white or black
            const userIsWhite = game.userColor === "white" || game.white.name === userName;
            const userIsBlack = game.userColor === "black" || game.black.name === userName;

            // Skip if user is not playing in this game
            if (!userIsWhite && !userIsBlack) return;

            // Count results based on user's color
            const result = game.result;
            if (result === "1-0") {
                if (userIsWhite) {
                    wins++;
                    currentStreak++;
                } else {
                    losses++;
                    currentStreak = 0;
                }
            } else if (result === "0-1") {
                if (userIsBlack) {
                    wins++;
                    currentStreak++;
                } else {
                    losses++;
                    currentStreak = 0;
                }
            } else if (result === "1/2-1/2") {
                draws++;
                currentStreak = 0;
            }

            if (currentStreak > bestStreak) bestStreak = currentStreak;

            // Calculate user's accuracy
            const userAccuracy = userIsWhite ? game.whiteAccuracy : game.blackAccuracy;
            if (userAccuracy) {
                totalAccuracy += userAccuracy;
                gamesWithAccuracy++;
            } else if (game.eval?.accuracy) {
                const evalAccuracy = userIsWhite ? game.eval.accuracy.white : game.eval.accuracy.black;
                if (evalAccuracy) {
                    totalAccuracy += evalAccuracy;
                    gamesWithAccuracy++;
                }
            }

            // Calculate moves and classifications if eval is available
            if (game.eval?.positions) {
                gamesWithEval++;
                const positions = game.eval.positions;
                totalMoves += Math.ceil(positions.length / 2); // Full moves

                // Count move classifications for user's moves only
                positions.forEach((pos, idx) => {
                    // White plays on even indices (0, 2, 4...), black on odd (1, 3, 5...)
                    const isWhiteMove = idx % 2 === 0;
                    if ((userIsWhite && isWhiteMove) || (userIsBlack && !isWhiteMove)) {
                        const classification = pos.moveClassification;
                        if (classification === MoveClassification.Splendid) totalBrilliant++;
                        else if (classification === MoveClassification.Excellent || classification === MoveClassification.Best) totalExcellent++;
                        else if (classification === MoveClassification.Blunder) totalBlunders++;
                        else if (classification === MoveClassification.Mistake) totalMistakes++;
                        else if (classification === MoveClassification.Inaccuracy) totalInaccuracies++;
                    }
                });
                gamesWithMoves++;
            }
        });

        const totalGames = wins + draws + losses;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
        const drawRate = totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0;
        const lossRate = totalGames > 0 ? Math.round((losses / totalGames) * 100) : 0;
        const accuracy = gamesWithAccuracy > 0 ? Math.round(totalAccuracy / gamesWithAccuracy) : 0;
        const avgMovesPerGame = gamesWithMoves > 0 ? Math.round(totalMoves / gamesWithMoves) : 0;
        const avgBrilliant = gamesWithEval > 0 ? (totalBrilliant / gamesWithEval).toFixed(1) : 0;
        const avgExcellent = gamesWithEval > 0 ? (totalExcellent / gamesWithEval).toFixed(1) : 0;
        const avgBlunders = gamesWithEval > 0 ? (totalBlunders / gamesWithEval).toFixed(1) : 0;
        const avgMistakes = gamesWithEval > 0 ? (totalMistakes / gamesWithEval).toFixed(1) : 0;
        const avgInaccuracies = gamesWithEval > 0 ? (totalInaccuracies / gamesWithEval).toFixed(1) : 0;

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
        };
    }, [games, session]);

    // Prepare data for charts
    const chartsData = useMemo(() => {
        if (!games || games.length === 0 || !session?.user?.name) {
            return {
                resultsData: [
                    { name: t("charts.wins"), value: 0, color: "#4caf50" },
                    { name: t("charts.draws"), value: 0, color: "#ff9800" },
                    { name: t("charts.losses"), value: 0, color: "#f44336" },
                ],
                activityData: [],
                accuracyData: [],
                openingsData: [],
                gameTypeData: [],
            };
        }

        const userName = session.user.name;

        // Results distribution
        let wins = 0;
        let draws = 0;
        let losses = 0;

        games.forEach((game) => {
            const userIsWhite = game.userColor === "white" || game.white.name === userName;
            const userIsBlack = game.userColor === "black" || game.black.name === userName;
            if (!userIsWhite && !userIsBlack) return;

            if (game.result === "1-0") {
                if (userIsWhite) wins++;
                else losses++;
            } else if (game.result === "0-1") {
                if (userIsBlack) wins++;
                else losses++;
            } else if (game.result === "1/2-1/2") {
                draws++;
            }
        });

        const resultsData = [
            { name: t("charts.wins"), value: wins, color: "#4caf50" },
            { name: t("charts.draws"), value: draws, color: "#ff9800" },
            { name: t("charts.losses"), value: losses, color: "#f44336" },
        ];

        // Activity data (last 7 days)
        const today = new Date();
        const activityMap = new Map<string, number>();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
           activityMap.set(dateStr, 0);
        }

        games.forEach((game) => {
            const userIsWhite = game.userColor === "white" || game.white.name === userName;
            const userIsBlack = game.userColor === "black" || game.black.name === userName;
            if (!userIsWhite && !userIsBlack) return;

            if (game.date) {
                const gameDate = new Date(game.date);
                const daysDiff = Math.floor((today.getTime() - gameDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff >= 0 && daysDiff < 7) {
                    const dateStr = gameDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
                }
            }
        });

        const activityData = Array.from(activityMap.entries()).map(([date, games]) => ({
            date,
            games,
        }));

        // Accuracy trend (last 20 games)
        const userGames = games.filter(game =>
            game.white.name === userName || game.black.name === userName || game.userColor === "white" || game.userColor === "black"
        );
        const recentGames = [...userGames].reverse().slice(0, 20);
        const accuracyData = recentGames.map((game, index) => {
            const userIsWhite = game.userColor === "white" || game.white.name === userName;
            let userAccuracy = userIsWhite ? game.whiteAccuracy : game.blackAccuracy;

            // Fallback to eval accuracy if direct accuracy is not available
            if (!userAccuracy && game.eval?.accuracy) {
                userAccuracy = userIsWhite ? game.eval.accuracy.white : game.eval.accuracy.black;
            }

            return {
                id: index + 1,
                accuracy: userAccuracy || 0
            };
        });

        // Top openings - FILTER OUT UNANALYZED GAMES
        const openingsMap = new Map<string, { games: number; wins: number }>();
        games.forEach((game) => {
            const userIsWhite = game.userColor === "white" || game.white.name === userName;
            const userIsBlack = game.userColor === "black" || game.black.name === userName;
            if (!userIsWhite && !userIsBlack) return;

            // Skip games without opening data (unanalyzed games)
            if (!game.openingName) return;

            const opening = game.openingName;
            const current = openingsMap.get(opening) || { games: 0, wins: 0 };
            current.games++;

            // Check if user won
            const userWon = (userIsWhite && game.result === "1-0") || (userIsBlack && game.result === "0-1");
            if (userWon) current.wins++;

            openingsMap.set(opening, current);
        });

        const openingsData = Array.from(openingsMap.entries())
            .map(([name, data]) => ({
                name: name.length > 25 ? name.substring(0, 25) + "..." : name,
                games: data.games,
                winRate: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
            }))
            .sort((a, b) => b.games - a.games)
            .slice(0, 5);

        // Game type distribution
        const gameTypeMap = new Map<string, number>();
        games.forEach((game) => {
            const userIsWhite = game.userColor === "white" || game.white.name === userName;
            const userIsBlack = game.userColor === "black" || game.black.name === userName;
            if (!userIsWhite && !userIsBlack) return;

            const gameType = game.gameType || classifyTimeControl(game.timeControl);
            gameTypeMap.set(gameType, (gameTypeMap.get(gameType) || 0) + 1);
        });

        const gameTypeData = Array.from(gameTypeMap.entries()).map(([name, value]) => ({
            name: translateGameType(name, t),
            value,
            color: getGameTypeColor(name),
        }));

        return {
            resultsData,
            activityData,
            accuracyData,
            openingsData,
            gameTypeData,
        };
    }, [games, session, t]);

    // NEW: Current year statistics
    const currentYearGames = useMemo(() => {
        if (!games || !session?.user?.name) return [];
        const userName = session.user.name;
        const userGames = games.filter((game) => {
            const userIsWhite = game.userColor === "white" || game.white.name === userName;
            const userIsBlack = game.userColor === "black" || game.black.name === userName;
            return userIsWhite || userIsBlack;
        });
        return filterCurrentYear(userGames);
    }, [games, session]);

    const bestVictory = useMemo(() => {
        if (!session?.user?.name) return null;
        return findBestVictory(currentYearGames, session.user.name);
    }, [currentYearGames, session]);

    const worstDefeat = useMemo(() => {
        if (!session?.user?.name) return null;
        return findWorstDefeat(currentYearGames, session.user.name);
    }, [currentYearGames, session]);

    const totalPlayTimeHours = useMemo(() => {
        let totalSeconds = 0;
        currentYearGames.forEach((game) => {
            totalSeconds += estimateGameDuration(game);
        });
        return totalSeconds / 3600;
    }, [currentYearGames]);

    const colorPerformance = useMemo(() => {
        if (!session?.user?.name) return { whiteWinRate: 0, blackWinRate: 0 };
        const userName = session.user.name;
        
        let whiteGames = 0, whiteWins = 0;
        let blackGames = 0, blackWins = 0;
        
        currentYearGames.forEach((game) => {
            const userIsWhite = game.userColor === "white" || game.white.name === userName;
            const userIsBlack = game.userColor === "black" || game.black.name === userName;
            
            if (userIsWhite) {
                whiteGames++;
                if (game.result === "1-0") whiteWins++;
            } else if (userIsBlack) {
                blackGames++;
                if (game.result === "0-1") blackWins++;
            }
        });
        
        return {
            whiteWinRate: whiteGames > 0 ? Math.round((whiteWins / whiteGames) * 100) : 0,
            blackWinRate: blackGames > 0 ? Math.round((blackWins / blackGames) * 100) : 0,
        };
    }, [currentYearGames, session]);

    const frequentOpponent = useMemo(() => {
        if (!session?.user?.name) return null;
        return findMostFrequentOpponent(currentYearGames, session.user.name);
    }, [currentYearGames, session]);

    const victoryBreakdown = useMemo(() => {
        if (!session?.user?.name) return { checkmate: 0, resignation: 0, timeout: 0 };
        const userName = session.user.name;
        
        let checkmate = 0, resignation = 0, timeout = 0;
        
        currentYearGames.forEach((game) => {
            const userIsWhite = game.userColor === "white" || game.white.name === userName;
            const userIsBlack = game.userColor === "black" || game.black.name === userName;
            
            const won = (userIsWhite && game.result === "1-0") || (userIsBlack && game.result === "0-1");
            if (!won) return;
            
            const termination = parseTermination(game.pgn);
            if (termination === "checkmate") checkmate++;
            else if (termination === "resignation") resignation++;
            else if (termination === "timeout") timeout++;
        });
        
        return { checkmate, resignation, timeout };
    }, [currentYearGames, session]);

    // Empty state
    if (!games || games.length === 0) {
        return (
            <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
                <PageTitle title={t("title")} />
                <Card elevation={2} sx={{ mt: 4 }}>
                    <CardContent sx={{ textAlign: "center", py: 8 }}>
                        <Icon icon="mdi:chart-box-outline" width={80} height={80} color="#ccc" />
                        <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                            {t("no_games_yet")}
                        </Typography>
                        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                            {t("no_games_description")}
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Icon icon="streamline:chess-pawn" />}
                            onClick={() => {
                                const locale = router.query.locale || "en";
                                router.push(`/${locale}/play`);
                            }}
                        >
                            {t("play_now")}
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
            <PageTitle title={t("title")} />

            {/* Main Stats */}
            <Box sx={{ mt: 4, mb: 4 }}>
                <DashboardStats
                    totalGames={stats.totalGames}
                    winRate={stats.winRate}
                    drawRate={stats.drawRate}
                    lossRate={stats.lossRate}
                    accuracy={stats.accuracy}
                    bestStreak={stats.bestStreak}
                />
            </Box>

            {/* Additional Stats */}
            <Box sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography color="textSecondary" variant="body2" gutterBottom>
                                    {t("stats.avg_moves")}
                                </Typography>
                                <Typography variant="h4" component="div" fontWeight="bold">
                                    {stats.avgMovesPerGame}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography color="textSecondary" variant="body2" gutterBottom>
                                    {t("stats.avg_brilliant")}
                                </Typography>
                                <Typography variant="h4" component="div" fontWeight="bold" color="#9c27b0">
                                    {stats.avgBrilliant}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography color="textSecondary" variant="body2" gutterBottom>
                                    {t("stats.avg_excellent")}
                                </Typography>
                                <Typography variant="h4" component="div" fontWeight="bold" color="#2196f3">
                                    {stats.avgExcellent}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography color="textSecondary" variant="body2" gutterBottom>
                                    {t("stats.avg_blunders")}
                                </Typography>
                                <Typography variant="h4" component="div" fontWeight="bold" color="#f44336">
                                    {stats.avgBlunders}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Charts */}
            <Box sx={{ mt: 4 }}>
                <DashboardCharts
                    resultsData={chartsData.resultsData}
                    activityData={chartsData.activityData}
                    accuracyData={chartsData.accuracyData}
                    openingsData={chartsData.openingsData}
                    gameTypeData={chartsData.gameTypeData}
                />
            </Box>

            {/* NEW: Enhanced Statistics for Current Year */}
            <Grid container spacing={3} sx={{ mt: 4 }}>
                <Grid size={12}>
                    <Typography variant="h5" gutterBottom>
                        📊 Statistiques {new Date().getFullYear()}
                    </Typography>
                </Grid>

                {/* Best/Worst Games */}
                <Grid size={12}>
                    <BestWorstGamesCard bestVictory={bestVictory} worstDefeat={worstDefeat} />
                </Grid>

                {/* Play Time & Color Performance */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <PlayTimeCard totalHours={totalPlayTimeHours} />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <ColorPerformanceChart 
                        whiteWinRate={colorPerformance.whiteWinRate} 
                        blackWinRate={colorPerformance.blackWinRate} 
                    />
                </Grid>

                {/* Most Frequent Opponent */}
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

                {/* Victory Breakdown */}
                <Grid size={{ xs: 12, md: frequentOpponent ? 6 : 12 }}>
                    <VictoryBreakdownChart 
                        checkmate={victoryBreakdown.checkmate}
                        resignation={victoryBreakdown.resignation}
                        timeout={victoryBreakdown.timeout}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}

// Helper function to classify time control
function classifyTimeControl(timeControl?: string): string {
    if (!timeControl) return "unknown";

    const match = timeControl.match(/^(\d+)/);
    if (!match) return "unknown";

    const seconds = parseInt(match[1]);

    if (seconds < 180) return "bullet";
    else if (seconds < 600) return "blitz";
    else if (seconds < 1800) return "rapid";
    else return "classical";
}

// Helper function to translate game type
function translateGameType(type: string, t: any): string {
    const typeMap: Record<string, string> = {
        bullet: t("game_types.bullet", { defaultValue: "Bullet" }),
        blitz: t("game_types.blitz", { defaultValue: "Blitz" }),
        rapid: t("game_types.rapid", { defaultValue: "Rapide" }),
        classical: t("game_types.classical", { defaultValue: "Classique" }),
        unknown: t("game_types.unknown", { defaultValue: "Inconnu" }),
    };
    return typeMap[type] || type;
}

// Helper function to get game type color
function getGameTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
        bullet: "#f44336",
        blitz: "#ff9800",
        rapid: "#2196f3",
        classical: "#4caf50",
        unknown: "#9e9e9e",
    };
    return colorMap[type] || "#9e9e9e";
}
