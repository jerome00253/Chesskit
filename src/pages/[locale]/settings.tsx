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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/pageTitle";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";
import { DEFAULT_TIME_SETTINGS, TimeSettings } from "@/lib/gameClassification";
import {
  AnalysisSettings,
  DEFAULT_ANALYSIS_SETTINGS,
  AVAILABLE_ENGINES,
  AVAILABLE_PIECE_SETS,
} from "@/types/analysisSettings";

export { getStaticPaths, getStaticProps };

export default function Settings() {
  const { data: session } = useSession();
  const t = useTranslations("Settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeSettings, setTimeSettings] = useState<TimeSettings>(
    DEFAULT_TIME_SETTINGS
  );
  const [analysisSettings, setAnalysisSettings] = useState<AnalysisSettings>(
    DEFAULT_ANALYSIS_SETTINGS
  );
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/user/settings/");
        if (res.ok) {
          const data = await res.json();
          if (data.timeSettings) {
            setTimeSettings(data.timeSettings as TimeSettings);
          }
          if (data.analysisSettings) {
            setAnalysisSettings(data.analysisSettings as AnalysisSettings);
          }
        }
      } catch {
        console.error("Failed to fetch settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [session]);

  const handleSliderChange =
    (field: keyof TimeSettings) =>
    (_event: Event, value: number | number[]) => {
      setTimeSettings((prev) => ({
        ...prev,
        [field]: value as number,
      }));
    };

  const handleAnalysisSliderChange =
    (field: keyof AnalysisSettings) =>
    (_event: Event, value: number | number[]) => {
      setAnalysisSettings((prev) => ({
        ...prev,
        [field]: value as number,
      }));
    };

  const handleAnalysisSelectChange =
    (field: keyof AnalysisSettings) => (event: any) => {
      setAnalysisSettings((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleAnalysisCheckboxChange =
    (field: keyof AnalysisSettings) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAnalysisSettings((prev) => ({
        ...prev,
        [field]: event.target.checked,
      }));
    };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeSettings, analysisSettings }),
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

        {/* Analysis Settings Card */}
        <Grid size={12}>
          <Card>
            <CardHeader
              title={t("analysis_title")}
              subheader={t("analysis_subtitle")}
            />
            <CardContent>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={4}>
                  {/* Engine Selection */}
                  <Grid size={12}>
                    <FormControl fullWidth>
                      <InputLabel>{t("engine")}</InputLabel>
                      <Select
                        value={analysisSettings.engineName}
                        label={t("engine")}
                        onChange={handleAnalysisSelectChange("engineName")}
                      >
                        {AVAILABLE_ENGINES.map((engine) => (
                          <MenuItem key={engine.value} value={engine.value}>
                            {engine.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Depth */}
                  <Grid size={12}>
                    <Typography gutterBottom>
                      <Icon
                        icon="mdi:chart-line-variant"
                        style={{ marginRight: 8 }}
                      />
                      {t("depth")}: <strong>{analysisSettings.depth}</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {t("depth_description")}
                    </Typography>
                    <Slider
                      value={analysisSettings.depth}
                      onChange={handleAnalysisSliderChange("depth")}
                      min={1}
                      max={30}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Grid>

                  {/* Multi PV (Variants) */}
                  <Grid size={12}>
                    <Typography gutterBottom>
                      <Icon icon="mdi:chart-tree" style={{ marginRight: 8 }} />
                      {t("multi_pv")}:{" "}
                      <strong>{analysisSettings.multiPv}</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {t("multi_pv_description")}
                    </Typography>
                    <Slider
                      value={analysisSettings.multiPv}
                      onChange={handleAnalysisSliderChange("multiPv")}
                      min={1}
                      max={5}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Grid>

                  {/* Display Options */}
                  <Grid size={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={analysisSettings.showBestMove}
                          onChange={handleAnalysisCheckboxChange(
                            "showBestMove"
                          )}
                        />
                      }
                      label={t("show_best_move")}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={analysisSettings.showPlayerMove}
                          onChange={handleAnalysisCheckboxChange(
                            "showPlayerMove"
                          )}
                        />
                      }
                      label={t("show_player_move")}
                    />
                  </Grid>

                  {/* Board Hue */}
                  <Grid size={12}>
                    <Typography gutterBottom>
                      <Icon icon="mdi:palette" style={{ marginRight: 8 }} />
                      {t("board_hue")}:{" "}
                      <strong>{analysisSettings.boardHue}°</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {t("board_hue_description")}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Slider
                        value={analysisSettings.boardHue}
                        onChange={handleAnalysisSliderChange("boardHue")}
                        min={0}
                        max={360}
                        step={1}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${v}°`}
                        sx={{ flex: 1 }}
                      />
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1,
                          border: 2,
                          borderColor: "divider",
                          background: `linear-gradient(135deg, 
                            hsl(${analysisSettings.boardHue}, 30%, 80%) 0%, 
                            hsl(${analysisSettings.boardHue}, 30%, 80%) 50%, 
                            hsl(${analysisSettings.boardHue}, 30%, 40%) 50%, 
                            hsl(${analysisSettings.boardHue}, 30%, 40%) 100%)`,
                        }}
                      />
                    </Box>
                  </Grid>

                  {/* Piece Set */}
                  <Grid size={12}>
                    <FormControl fullWidth>
                      <InputLabel>{t("piece_set")}</InputLabel>
                      <Select
                        value={analysisSettings.pieceSet}
                        label={t("piece_set")}
                        onChange={handleAnalysisSelectChange("pieceSet")}
                        renderValue={(value) => {
                          const set = AVAILABLE_PIECE_SETS.find(
                            (s) => s.value === value
                          );
                          return (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <img
                                src={`/piece/${value}/wN.svg`}
                                alt="Knight"
                                style={{ width: 32, height: 32 }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                              <span>{set?.label}</span>
                            </Box>
                          );
                        }}
                      >
                        {AVAILABLE_PIECE_SETS.map((set) => (
                          <MenuItem key={set.value} value={set.value}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <img
                                src={`/piece/${set.value}/wN.svg`}
                                alt="Knight"
                                style={{ width: 32, height: 32 }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                              <span>{set.label}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Threads */}
                  <Grid size={12}>
                    <Typography gutterBottom>
                      <Icon icon="mdi:cpu-32-bit" style={{ marginRight: 8 }} />
                      {t("threads")}:{" "}
                      <strong>{analysisSettings.threads}</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {t("threads_description")}
                    </Typography>
                    <Slider
                      value={analysisSettings.threads}
                      onChange={handleAnalysisSliderChange("threads")}
                      min={1}
                      max={12}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
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
