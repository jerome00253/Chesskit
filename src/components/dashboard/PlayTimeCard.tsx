import { Card, CardContent, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

interface PlayTimeCardProps {
  totalHours: number;
}

export function PlayTimeCard({ totalHours }: PlayTimeCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Icon icon="mdi:clock-outline" style={{ marginRight: 8, verticalAlign: "middle" }} />
          Temps de Jeu
        </Typography>
        <Typography variant="h3" color="primary.main" sx={{ mt: 2 }}>
          {totalHours.toFixed(1)}h
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Total cette année
        </Typography>
      </CardContent>
    </Card>
  );
}
