import { Card, CardContent, Typography } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface VictoryBreakdownChartProps {
  checkmate: number;
  resignation: number;
  timeout: number;
}

export function VictoryBreakdownChart({ checkmate, resignation, timeout }: VictoryBreakdownChartProps) {
  const data = [
    { name: "Échec et mat", value: checkmate },
    { name: "Abandon", value: resignation },
    { name: "Temps dépassé", value: timeout },
  ].filter((entry) => entry.value > 0); // Only show categories with values

  const COLORS = ["#4caf50", "#ff9800", "#f44336"];

  const total = checkmate + resignation + timeout;

  if (total === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Répartition des Victoires
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Aucune victoire cette année
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📊 Répartition des Victoires
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
