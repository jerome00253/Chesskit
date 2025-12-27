import {
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid2 as Grid,
  Typography,
  Checkbox,
  FormGroup,
  Box,
  Chip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface AutoImportSettingsProps {
  onUpdate?: () => void;
}

export function AutoImportSettings({ onUpdate }: AutoImportSettingsProps) {
  const t = useTranslations("Profile.AutoImport");
  const [enabled, setEnabled] = useState(false);
  const [platforms, setPlatforms] = useState({ chesscom: true, lichess: true });
  const [interval, setInterval] = useState(21600);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const INTERVAL_OPTIONS = [
    { value: 3600, label: t("hours", { count: 1 }) },
    { value: 10800, label: t("hours", { count: 3 }) },
    { value: 21600, label: t("hours", { count: 6 }) },
    { value: 43200, label: t("hours", { count: 12 }) },
    { value: 86400, label: t("hours", { count: 24 }) },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.autoImportEnabled || false);
        setPlatforms(data.autoImportPlatforms || { chesscom: true, lichess: true });
        setInterval(data.autoImportInterval || 21600);
        setLastImport(data.lastAutoImport);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (overrides: Partial<{ enabled: boolean; platforms: typeof platforms; interval: number }> = {}) => {
    const newEnabled = overrides.enabled ?? enabled;
    const newPlatforms = overrides.platforms ?? platforms;
    const newInterval = overrides.interval ?? interval;

    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoImportEnabled: newEnabled,
          autoImportPlatforms: newPlatforms,
          autoImportInterval: newInterval,
        }),
      });

      if (res.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    handleSave({ enabled: checked });
  };

  const handlePlatformChange = (platform: "chesscom" | "lichess", checked: boolean) => {
    const newPlatforms = { ...platforms, [platform]: checked };
    setPlatforms(newPlatforms);
    handleSave({ platforms: newPlatforms });
  };

  const handleIntervalChange = (value: number) => {
    setInterval(value);
    handleSave({ interval: value });
  };

  const formatLastImport = (date: string | null) => {
    if (!date) return t("never");
    const d = new Date(date);
    return d.toLocaleString("fr-FR");
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader 
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Icon icon="mdi:refresh-auto" width={24} />
            {t("title")}
            {saving && <Icon icon="line-md:loading-loop" width={20} style={{ marginLeft: "auto" }} />}
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Enable/Disable */}
          <Grid size={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(e) => handleEnabledChange(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">{t("enable")}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("description")}
                  </Typography>
                </Box>
              }
            />
          </Grid>

          {enabled && (
            <>
              {/* Platforms */}
              <Grid size={12}>
                <Typography variant="subtitle2" gutterBottom>
                  {t("platforms")}
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={platforms.chesscom}
                        onChange={(e) => handlePlatformChange("chesscom", e.target.checked)}
                        icon={<Icon icon="simple-icons:chessdotcom" />}
                        checkedIcon={<Icon icon="simple-icons:chessdotcom" color="#6D9E40" />}
                      />
                    }
                    label="Chess.com"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={platforms.lichess}
                        onChange={(e) => handlePlatformChange("lichess", e.target.checked)}
                        icon={<Icon icon="simple-icons:lichess" />}
                        checkedIcon={<Icon icon="simple-icons:lichess" color="#000" />}
                      />
                    }
                    label="Lichess"
                  />
                </FormGroup>
              </Grid>

              {/* Interval */}
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>{t("interval")}</InputLabel>
                  <Select
                    value={interval}
                    label={t("interval")}
                    onChange={(e) => handleIntervalChange(Number(e.target.value))}
                  >
                    {INTERVAL_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Last Import */}
              <Grid size={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Icon icon="mdi:clock-outline" />
                  <Typography variant="body2" color="text.secondary">
                    {t("last_import")} : {formatLastImport(lastImport)}
                  </Typography>
                  {lastImport && (
                    <Chip 
                      label={t("active")}
                      color="success"
                      size="small"
                      icon={<Icon icon="mdi:check-circle" />}
                    />
                  )}
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}
