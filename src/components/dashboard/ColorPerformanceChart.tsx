import { Card, CardContent, Typography } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTranslations } from "next-intl";

interface ColorPerformanceChartProps {
  whiteWinRate: number;
  blackWinRate: number;
}

export function ColorPerformanceChart({ whiteWinRate, blackWinRate }: ColorPerformanceChartProps) {
  const t = useTranslations("Dashboard");

  const data = [
    { color: t("YearlyStats.white"), winRate: whiteWinRate },
    { color: t("YearlyStats.black"), winRate: blackWinRate },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          ⚔️ {t("YearlyStats.color_performance_title")}
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="color" />
            <YAxis domain={[0, 100]} label={{ value: "%", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Bar dataKey="winRate" radius={[8, 8, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? "#f5f5dc" : "#404040"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, textAlign: "center" }}>
          {t("YearlyStats.win_rate_by_color")}
        </Typography>
      </CardContent>
    </Card>
  );
}
