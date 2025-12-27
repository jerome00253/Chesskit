import { Card, CardContent, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface PlayTimeCardProps {
  totalHours: number;
}

export function PlayTimeCard({ totalHours }: PlayTimeCardProps) {
  const t = useTranslations("Dashboard");

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Icon
            icon="mdi:clock-outline"
            style={{ marginRight: 8, verticalAlign: "middle" }}
          />
          {t("YearlyStats.play_time_title")}
        </Typography>
        <Typography variant="h3" color="primary.main" sx={{ mt: 2 }}>
          {totalHours.toFixed(1)}h
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t("YearlyStats.total_this_year")}
        </Typography>
      </CardContent>
    </Card>
  );
}
