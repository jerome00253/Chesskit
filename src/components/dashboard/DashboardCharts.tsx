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
    LineChart,
    Line,
} from "recharts";
import { Card, CardContent, Typography, Grid2 as Grid, Box, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";

interface DashboardChartsProps {
    resultsData: { name: string; value: number; color: string }[];
    activityData: { date: string; games: number }[];
    accuracyData: { id: number; accuracy: number }[];
    openingsData: { name: string; games: number; winRate: number }[];
    gameTypeData: { name: string; value: number; color: string }[];
}

export default function DashboardCharts({
    resultsData,
    activityData,
    accuracyData,
    openingsData,
    gameTypeData,
}: DashboardChartsProps) {
    const theme = useTheme();
    const t = useTranslations("Dashboard.charts");

    return (
        <Grid container spacing={3} width="100%">
            {/* Results Distribution */}
            <Grid size={{ xs: 12, md: 4 }}>
                <Card elevation={2} sx={{ height: "100%" }}>
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

            {/* Activity Chart */}
            <Grid size={{ xs: 12, md: 8 }}>
                <Card elevation={2} sx={{ height: "100%" }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {t("activity")}
                        </Typography>
                        <Box height={300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme.palette.background.paper,
                                            color: theme.palette.text.primary,
                                        }}
                                    />
                                    <Bar dataKey="games" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Accuracy Trend */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Card elevation={2} sx={{ height: "100%" }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {t("accuracy_trend")}
                        </Typography>
                        <Box height={300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={accuracyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="accuracy"
                                        stroke={theme.palette.secondary.main}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Top Openings */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Card elevation={2} sx={{ height: "100%" }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {t("top_openings")}
                        </Typography>
                        <Box height={300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={openingsData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="games" name={t("games_played")} fill="#8884d8" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Game Type Distribution */}
            {gameTypeData && gameTypeData.length > 0 && (
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={2} sx={{ height: "100%" }}>
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
        </Grid>
    );
}
