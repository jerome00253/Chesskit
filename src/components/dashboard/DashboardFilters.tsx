import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Paper,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { TimePeriod, GameSource } from "@/lib/statsHelpers";

interface DashboardFiltersProps {
  period: TimePeriod;
  setPeriod: (period: TimePeriod) => void;
  source: GameSource;
  setSource: (source: GameSource) => void;
}

export default function DashboardFilters({
  period,
  setPeriod,
  source,
  setSource,
}: DashboardFiltersProps) {
  const t = useTranslations("Dashboard.filters");

  const handlePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: TimePeriod | null
  ) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        display: "flex",
        flexWrap: "wrap",
        gap: 3,
        bgcolor: "background.paper",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Period Selector */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Icon icon="mdi:calendar-range" width={16} />
          {t("period")}
        </Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          color="primary"
          size="small"
          aria-label="time period"
          sx={{
            "& .MuiToggleButton-root": {
              px: 2,
              py: 0.5,
              textTransform: "none",
              fontWeight: 500,
            },
          }}
        >
          <ToggleButton value="week">{t("last_week")}</ToggleButton>
          <ToggleButton value="month">{t("last_month")}</ToggleButton>
          <ToggleButton value="6months">{t("last_6_months")}</ToggleButton>
          <ToggleButton value="year">{t("last_year")}</ToggleButton>
          <ToggleButton value="current_year">{t("current_year")}</ToggleButton>
          <ToggleButton value="all">{t("all_time")}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Source Selector */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Icon icon="mdi:source-branch" width={16} />
          {t("source")}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={source}
            onChange={(e) => setSource(e.target.value as GameSource)}
            displayEmpty
            inputProps={{ "aria-label": "Without label" }}
          >
            <MenuItem value="all">{t("all_games")}</MenuItem>
            <MenuItem value="chesscom">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Icon icon="simple-icons:chessdotcom" />
                {t("chesscom")}
              </Box>
            </MenuItem>
            <MenuItem value="lichess">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Icon icon="simple-icons:lichess" />
                {t("lichess")}
              </Box>
            </MenuItem>
            <MenuItem value="other">{t("other")}</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}
