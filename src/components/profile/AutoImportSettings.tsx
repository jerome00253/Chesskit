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
  Button,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";

interface AutoImportSettingsProps {
  onUpdate?: () => void;
}

const INTERVAL_OPTIONS = [
  { value: 3600, label: "1 heure" },
  { value: 10800, label: "3 heures" },
  { value: 21600, label: "6 heures" },
  { value: 43200, label: "12 heures" },
  { value: 86400, label: "24 heures" },
];

export function AutoImportSettings({ onUpdate }: AutoImportSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [platforms, setPlatforms] = useState({ chesscom: true, lichess: true });
  const [interval, setInterval] = useState(21600);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoImportEnabled: enabled,
          autoImportPlatforms: platforms,
          autoImportInterval: interval,
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

  const formatLastImport = (date: string | null) => {
    if (!date) return "Jamais";
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
            Import Automatique
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
                  onChange={(e) => setEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Activer l'import automatique</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Importe automatiquement vos nouvelles parties à intervalle régulier
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
                  Plateformes
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={platforms.chesscom}
                        onChange={(e) =>
                          setPlatforms({ ...platforms, chesscom: e.target.checked })
                        }
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
                        onChange={(e) =>
                          setPlatforms({ ...platforms, lichess: e.target.checked })
                        }
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
                  <InputLabel>Intervalle d'import</InputLabel>
                  <Select
                    value={interval}
                    label="Intervalle d'import"
                    onChange={(e) => setInterval(Number(e.target.value))}
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
                    Dernier import : {formatLastImport(lastImport)}
                  </Typography>
                  {lastImport && (
                    <Chip 
                      label="Actif"
                      color="success"
                      size="small"
                      icon={<Icon icon="mdi:check-circle" />}
                    />
                  )}
                </Box>
              </Grid>
            </>
          )}

          {/* Save Button */}
          <Grid size={12}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={
                saving ? <Icon icon="mdi:loading" className="animate-spin" /> : <Icon icon="mdi:content-save" />
              }
            >
              {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
