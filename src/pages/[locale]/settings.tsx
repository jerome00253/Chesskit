import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid2 as Grid,
  Slider,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/pageTitle";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";
import { DEFAULT_TIME_SETTINGS, TimeSettings } from "@/lib/gameClassification";

export { getStaticPaths, getStaticProps };

export default function Settings() {
  const { data: session } = useSession();
  const t = useTranslations("Settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeSettings, setTimeSettings] = useState<TimeSettings>(
    DEFAULT_TIME_SETTINGS
  );
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.timeSettings) {
            setTimeSettings(data.timeSettings as TimeSettings);
          }
        }
      } catch {
        console.error("Failed to fetch settings");
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchSettings();
  }, [session]);

  const handleSliderChange =
    (field: keyof TimeSettings) =>
    (_event: Event, value: number | number[]) => {
      setTimeSettings((prev) => ({
        ...prev,
        [field]: value as number,
      }));
    };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeSettings }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t("save_success") });
      } else {
        setMessage({ type: "error", text: t("save_error") });
      }
    } catch {
      setMessage({ type: "error", text: t("save_error") });
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <PageTitle title={t("title")} />

      <Snackbar
        open={!!message.text}
        autoHideDuration={6000}
        onClose={() => setMessage({ type: "", text: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={message.type as "success" | "error"}
          onClose={() => setMessage({ type: "", text: "" })}
        >
          {message.text}
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        <Grid size={12}>
          <Card>
            <CardHeader
              title={t("time_control_title")}
              subheader={t("time_control_subtitle")}
            />
            <CardContent>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={4}>
                  {/* Bullet Threshold */}
                  <Grid size={12}>
                    <Typography gutterBottom>
                      <Icon
                        icon="mdi:lightning-bolt"
                        style={{ marginRight: 8 }}
                      />
                      {t("bullet_threshold")}:{" "}
                      <strong>{timeSettings.bulletMax} min</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {t("bullet_description")}
                    </Typography>
                    <Slider
                      value={timeSettings.bulletMax}
                      onChange={handleSliderChange("bulletMax")}
                      min={1}
                      max={5}
                      step={0.5}
                      marks
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${v} min`}
                    />
                  </Grid>

                  {/* Blitz Threshold */}
                  <Grid size={12}>
                    <Typography gutterBottom>
                      <Icon icon="mdi:timer" style={{ marginRight: 8 }} />
                      {t("blitz_threshold")}:{" "}
                      <strong>{timeSettings.blitzMax} min</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {t("blitz_description")}
                    </Typography>
                    <Slider
                      value={timeSettings.blitzMax}
                      onChange={handleSliderChange("blitzMax")}
                      min={5}
                      max={15}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${v} min`}
                    />
                  </Grid>

                  {/* Rapid Threshold */}
                  <Grid size={12}>
                    <Typography gutterBottom>
                      <Icon
                        icon="mdi:clock-outline"
                        style={{ marginRight: 8 }}
                      />
                      {t("rapid_threshold")}:{" "}
                      <strong>{timeSettings.rapidMax} min</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {t("rapid_description")}
                    </Typography>
                    <Slider
                      value={timeSettings.rapidMax}
                      onChange={handleSliderChange("rapidMax")}
                      min={15}
                      max={90}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${v} min`}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saving || loading}
            startIcon={
              saving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Icon icon="mdi:content-save" />
              )
            }
          >
            {t("save")}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
