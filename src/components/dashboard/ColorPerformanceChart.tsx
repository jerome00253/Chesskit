import { Card, CardContent, Typography, Box, Divider } from "@mui/material";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

interface ColorPerformanceChartProps {
  whiteWinRate: number;
  blackWinRate: number;
}

export function ColorPerformanceChart({
  whiteWinRate,
  blackWinRate,
}: ColorPerformanceChartProps) {
  const t = useTranslations("Dashboard");

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Icon
            icon="mdi:chess-pawn"
            style={{ marginRight: 8, verticalAlign: "middle" }}
          />
          {t("YearlyStats.color_performance_title")}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            mt: 2,
          }}
        >
          {/* White Stats */}
          <Box sx={{ textAlign: "center" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
                color: "text.primary",
              }}
            >
              <Icon
                icon="mdi:chess-pawn"
                width={24}
                style={{
                  color: "#e0e0e0", // Off-white/light grey for visibility
                  filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.3))",
                }}
              />
            </Box>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {whiteWinRate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("YearlyStats.white")}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

          {/* Black Stats */}
          <Box sx={{ textAlign: "center" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
                color: "text.primary",
              }}
            >
              <Icon
                icon="mdi:chess-pawn"
                width={24}
                style={{ color: "#404040" }}
              />
            </Box>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {blackWinRate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("YearlyStats.black")}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
